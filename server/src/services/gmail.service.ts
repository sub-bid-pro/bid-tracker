import { supabaseAdmin } from '../lib/supabase';
import { google } from 'googleapis';
import { decodeBase64 } from '../utils/string.utils';
import { parseBidEmail, extractBidAmountFromPDF } from '../utils/parser.utils';
import { findOrCreateFolder, uploadAttachmentToDrive } from './drive.service';
import { oauth2Client } from '../lib/google';

// @ts-ignore - Tell TypeScript to ignore the lack of type definitions
import pdfParse from 'pdf-parse';

interface Attachment {
  filename: string;
  attachmentId: string;
}

/**
 * Ensures the nested folder structure exists and returns the IDs.
 * Structure: [Root Folder] / [Year] / [Project Name] / [Invitations | Submissions]
 */
const getProjectFolderStructure = async (
  projectName: string,
  emailType: 'ITB' | 'SUBMISSION',
  rootFolderName: string = 'Bid Tracker App',
) => {
  const currentYear = new Date().getFullYear().toString();
  const safeJobName = (projectName || 'Unknown Project').replace(/[/\\?%*:|"<>]/g, '-');
  const typeFolderName = emailType === 'ITB' ? 'Invitations' : 'Submissions';

  const rootId = await findOrCreateFolder(rootFolderName);
  const yearId = await findOrCreateFolder(currentYear, rootId);
  const projectFolderId = await findOrCreateFolder(safeJobName, yearId);
  const typeFolderId = await findOrCreateFolder(typeFolderName, projectFolderId);

  return { projectFolderId, typeFolderId };
};

export const syncUserBids = async (userId: string) => {
  console.log(`\n===========================================`);
  console.log(`Starting Gmail Sync for User: ${userId}`);
  console.log(`===========================================\n`);

  try {
    // 1. Fetch Tokens & Profile Settings
    const [tokenResponse, profileResponse] = await Promise.all([
      supabaseAdmin.from('google_tokens').select('*').eq('id', userId).single(),
      supabaseAdmin
        .from('profiles')
        .select('storage_preference, drive_root_folder_name')
        .eq('id', userId)
        .single(),
    ]);

    if (!tokenResponse.data) throw new Error('No Google tokens found for user');

    const useDrive = profileResponse.data?.storage_preference === 'google_drive';
    const driveRootName = profileResponse.data?.drive_root_folder_name || 'Bid Tracker App';

    oauth2Client.setCredentials({
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log(`[Gmail API] Fetching messages list...`);
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'smartbidnet.com OR buildingconnected.com OR (subject:("bid" OR "proposal") has:attachment in:sent)',
      maxResults: 25,
    });

    const messages = response.data.messages || [];
    console.log(`[Gmail API] Found ${messages.length} potential messages.\n`);

    for (const msg of messages) {
      if (!msg.id || !msg.threadId) continue;

      // Check DB for BOTH the processed email and the associated bid BEFORE downloading payload
      const [emailCheck, bidCheck] = await Promise.all([
        supabaseAdmin.from('processed_emails').select('id').eq('email_id', msg.id).single(),
        supabaseAdmin
          .from('bids')
          .select('id, job_name, drive_folder_id')
          .eq('user_id', userId)
          .eq('thread_id', msg.threadId)
          .single(),
      ]);

      const existingEmail = emailCheck.data;
      const existingThreadBid = bidCheck.data;

      // --- RETROACTIVE SYNC LOGIC ---
      if (existingEmail) {
        // If the user doesn't want Drive, or we already have the Drive folder linked, skip completely.
        if (!useDrive || (existingThreadBid && existingThreadBid.drive_folder_id)) {
          console.log(`[Skip] Message ${msg.id} already processed.`);
          continue;
        }
        // Otherwise, allow the script to continue to fetch the missing attachments!
        console.log(
          `[Retroactive Sync] Message ${msg.id} missing Drive files. Fetching attachments...`,
        );
      }

      console.log(`\n--- Fetching Full Detail for Message ${msg.id} ---`);
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });

      const threadId = msg.threadId;
      const isSentItem = detail.data.labelIds?.includes('SENT') || false;

      const headers = detail.data.payload?.headers;
      const subjectHeader = headers?.find((h) => h.name?.toLowerCase() === 'subject');
      const subject = subjectHeader ? subjectHeader.value || '' : '';

      const payload = detail.data.payload;
      let encodedBody = '';
      const attachments: Attachment[] = [];

      // --- RECURSIVE SEARCH FOR BODY & ATTACHMENTS ---
      const extractParts = (parts: any[]) => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            encodedBody = part.body.data;
          } else if (part.filename?.toLowerCase().endsWith('.pdf') && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              attachmentId: part.body.attachmentId,
            });
            console.log(`[Attachment] Found PDF: ${part.filename}`);
          }

          if (part.parts) {
            extractParts(part.parts);
          }
        }
      };

      if (payload?.parts) {
        extractParts(payload.parts);
      } else if (payload?.body?.data) {
        encodedBody = payload.body.data;
      }

      if (!encodedBody && attachments.length === 0) {
        console.log(`[Skip] Could not extract text body OR attachments for message ${msg.id}`);
        continue;
      }

      const rawText = encodedBody ? decodeBase64(encodedBody) : '';
      const parsedData = parseBidEmail(rawText, subject, isSentItem);

      // --- ATTACHMENT PROCESSING (Parsing & Optional Drive Upload) ---
      let projectFolderId: string | undefined;
      let mainAttachmentUrl: string | undefined;
      let finalBidAmount: number | null = null;

      if (attachments.length > 0) {
        let folders: { projectFolderId: string; typeFolderId: string } | null = null;

        if (useDrive) {
          console.log(`[Drive API] Organizing and uploading ${attachments.length} attachments...`);
          folders = await getProjectFolderStructure(
            parsedData.project_name,
            parsedData.email_type,
            driveRootName,
          );
          projectFolderId = folders.projectFolderId;
        }

        for (const att of attachments) {
          console.log(
            `[Gmail API] Downloading Attachment ${att.attachmentId} (${att.filename})...`,
          );
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: msg.id,
            id: att.attachmentId,
          });

          if (attachment.data.data) {
            const pdfBuffer = Buffer.from(
              attachment.data.data.replace(/-/g, '+').replace(/_/g, '/'),
              'base64',
            );

            // 1. ALWAYS PARSE FOR AMOUNT (If it's a submission and we haven't found a price yet)
            if (parsedData.email_type === 'SUBMISSION' && finalBidAmount === null) {
              let pdfDataText = '';
              try {
                if (typeof pdfParse === 'function') {
                  const pdfData = await pdfParse(pdfBuffer);
                  pdfDataText = pdfData.text;
                } else if (pdfParse && typeof pdfParse.default === 'function') {
                  const pdfData = await pdfParse.default(pdfBuffer);
                  pdfDataText = pdfData.text;
                } else if (pdfParse && pdfParse.PDFParse) {
                  const parser = new pdfParse.PDFParse({ data: pdfBuffer });
                  const parsed = await parser.getText();
                  pdfDataText = parsed.text || '';
                  if (typeof parser.destroy === 'function') await parser.destroy();
                }

                if (pdfDataText) {
                  finalBidAmount = extractBidAmountFromPDF(pdfDataText);
                }
              } catch (err) {
                console.error('Failed to parse PDF for amount:', err);
              }
            }

            // 2. ONLY UPLOAD IF PREFERENCE IS SET
            if (useDrive && folders) {
              const driveFile = await uploadAttachmentToDrive(
                att.filename,
                'application/pdf',
                pdfBuffer,
                folders.typeFolderId,
              );
              console.log(`[Drive API] Uploaded successfully: ${driveFile.webViewLink}`);

              // Set the main URL to the first successfully uploaded file
              if (!mainAttachmentUrl) {
                mainAttachmentUrl = driveFile.webViewLink || undefined;
              }
            }
          }
        }
      }

      // --- DB OPERATIONS ---
      let targetBidId = existingThreadBid?.id;

      // If we don't have a direct thread match, check for a fuzzy name match on Submissions
      if (!targetBidId && parsedData.email_type === 'SUBMISSION') {
        console.log(
          `[DB] No Thread Match. Attempting fuzzy match for "${parsedData.project_name}"`,
        );
        const { data: fallbackBid } = await supabaseAdmin
          .from('bids')
          .select('id, job_name')
          .eq('user_id', userId)
          .ilike('job_name', `%${parsedData.project_name}%`)
          .single();

        targetBidId = fallbackBid?.id;
        if (targetBidId)
          console.log(`[DB] Fuzzy match successful! Matched to: "${fallbackBid?.job_name}"`);
      }

      if (targetBidId) {
        // We found an existing bid! Update it instead of duplicating.
        console.log(`[DB] Updating existing Bid ${targetBidId} with latest info/links.`);
        const updateData: any = { thread_id: threadId };

        if (parsedData.email_type === 'SUBMISSION') {
          updateData.status = 'Submitted';
          if (finalBidAmount !== null) updateData.final_bid_amount = finalBidAmount;
        }

        if (projectFolderId) updateData.drive_folder_id = projectFolderId;
        if (mainAttachmentUrl) updateData.attachment_url = mainAttachmentUrl;

        await supabaseAdmin.from('bids').update(updateData).eq('id', targetBidId);
      } else {
        // No match found anywhere, create a brand new bid.
        console.log(`[DB] Creating NEW Bid...`);
        const receivedAt = detail.data.internalDate
          ? new Date(Number(detail.data.internalDate)).toISOString()
          : new Date().toISOString();

        await supabaseAdmin.from('bids').insert({
          user_id: userId,
          raw_email_id: msg.id,
          thread_id: threadId,
          general_contractor: parsedData.vendor_name,
          job_name: parsedData.project_name,
          bid_due_date: parsedData.due_date,
          status: parsedData.email_type === 'SUBMISSION' ? 'Submitted' : 'Needs Review',
          final_bid_amount: finalBidAmount,
          email_received_at: receivedAt,
          drive_folder_id: projectFolderId,
          attachment_url: mainAttachmentUrl,
        });
      }

      // Mark email as processed ONLY if it wasn't already marked
      if (!existingEmail) {
        await supabaseAdmin.from('processed_emails').insert({ email_id: msg.id, user_id: userId });
      }
      console.log(`[Success] Finished processing Message ${msg.id}\n`);
    }

    console.log(`\n===========================================`);
    console.log(`Sync Complete`);
    console.log(`===========================================\n`);
  } catch (error: any) {
    console.error(`\n[FATAL ERROR] Failed to sync bids:`, error.message || error);
    if (error.message === 'invalid_grant' || error?.response?.data?.error === 'invalid_grant') {
      await supabaseAdmin.from('google_tokens').delete().eq('id', userId);
      await supabaseAdmin.from('profiles').update({ gmail_connected: false }).eq('id', userId);
      throw new Error('Gmail connection expired. Please reconnect your account in Settings.');
    }
    throw new Error('Failed to sync bids with Google.');
  }
};

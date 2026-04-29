import { supabaseAdmin } from '../lib/supabase';
import { google } from 'googleapis';
import { decodeBase64 } from '../utils/string.utils';
import { parseBidEmail, extractBidAmountFromPDF } from '../utils/parser.utils';

// @ts-ignore - Tell TypeScript to ignore the lack of type definitions
import pdfParse from 'pdf-parse';

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const syncUserBids = async (userId: string) => {
  console.log(`\n===========================================`);
  console.log(`Starting Gmail Sync for User: ${userId}`);
  console.log(`===========================================\n`);

  try {
    const { data: tokenData } = await supabaseAdmin
      .from('google_tokens')
      .select('*')
      .eq('id', userId)
      .single();

    if (!tokenData) throw new Error('No Google tokens found for user');

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
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
      if (!msg.id) continue;

      const { data: existingEmail } = await supabaseAdmin
        .from('processed_emails')
        .select('id')
        .eq('email_id', msg.id)
        .single();

      if (existingEmail) {
        console.log(`[Skip] Message ${msg.id} already processed.`);
        continue;
      }

      console.log(`\n--- Fetching Full Detail for Message ${msg.id} ---`);
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });

      const threadId = detail.data.threadId;
      const isSentItem = detail.data.labelIds?.includes('SENT') || false;

      const headers = detail.data.payload?.headers;
      const subjectHeader = headers?.find((h) => h.name?.toLowerCase() === 'subject');
      const subject = subjectHeader ? subjectHeader.value || '' : '';

      const payload = detail.data.payload;
      let encodedBody = '';
      let attachmentId = null;

      // --- NEW: RECURSIVE SEARCH FOR BODY & ATTACHMENT ---
      const extractParts = (parts: any[]) => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            encodedBody = part.body.data;
          } else if (part.filename?.toLowerCase().endsWith('.pdf') && part.body?.attachmentId) {
            attachmentId = part.body.attachmentId;
            console.log(`[Attachment] Found PDF: ${part.filename}`);
          }

          // If this part contains more nested parts, dig deeper!
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

      // --- NEW: DON'T SKIP IF WE HAVE AN ATTACHMENT ---
      if (!encodedBody && !attachmentId) {
        console.log(`[Skip] Could not extract text body OR attachment for message ${msg.id}`);
        continue;
      }

      // If there's no text body but there IS an attachment, just use a blank string so the parser doesn't crash
      const rawText = encodedBody ? decodeBase64(encodedBody) : '';
      const parsedData = parseBidEmail(rawText, subject, isSentItem);

      // --- DB OPERATIONS ---
      const { data: existingThreadBid } = await supabaseAdmin
        .from('bids')
        .select('id, job_name')
        .eq('user_id', userId)
        .eq('thread_id', threadId)
        .single();

      if (existingThreadBid) {
        console.log(`[DB] Matched existing Thread ID for bid: "${existingThreadBid.job_name}"`);
      }

      if (parsedData.email_type === 'ITB' && !existingThreadBid) {
        console.log(`[DB] Creating NEW "Needs Review" Bid...`);
        const receivedAt = detail.data.internalDate
          ? new Date(Number(detail.data.internalDate)).toISOString()
          : new Date().toISOString();

        const { error } = await supabaseAdmin.from('bids').insert({
          user_id: userId,
          raw_email_id: msg.id,
          thread_id: threadId,
          general_contractor: parsedData.vendor_name,
          job_name: parsedData.project_name,
          bid_due_date: parsedData.due_date,
          status: 'Needs Review',
          email_received_at: receivedAt,
        });

        if (error) console.error(`[DB ERROR] Failed to insert ITB:`, error);
      }

      if (parsedData.email_type === 'SUBMISSION' && attachmentId) {
        console.log(`[Gmail API] Downloading Attachment ${attachmentId}...`);
        const attachment = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: msg.id,
          id: attachmentId,
        });

        if (attachment.data.data) {
          const pdfBuffer = Buffer.from(
            attachment.data.data.replace(/-/g, '+').replace(/_/g, '/'),
            'base64',
          );

          let pdfDataText = '';
          if (typeof pdfParse === 'function') {
            const pdfData = await pdfParse(pdfBuffer);
            pdfDataText = pdfData.text;
          } else if (pdfParse && typeof pdfParse.default === 'function') {
            const pdfData = await pdfParse.default(pdfBuffer);
            pdfDataText = pdfData.text;
          } else if (pdfParse && pdfParse.PDFParse) {
            // NEW: Handle v2 Class-based API
            const parser = new pdfParse.PDFParse({ data: pdfBuffer });
            try {
              const parsed = await parser.getText();
              pdfDataText = parsed.text || '';
            } catch (err) {
              console.error('Failed to parse with PDFParse class:', err);
            } finally {
              // Prevent memory leaks in v2
              if (typeof parser.destroy === 'function') await parser.destroy();
            }
          } else {
            console.error('PDF Parse loaded incorrectly. Unrecognized export:', pdfParse);
            continue; // Skip this PDF instead of crashing the whole server
          }

          // Pass the extracted string to your amount extractor
          const finalAmount = extractBidAmountFromPDF(pdfDataText);

          let targetBidId = existingThreadBid?.id;

          if (!targetBidId) {
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
            else console.log(`[DB WARNING] Fuzzy match failed. No prior bid found.`);
          }

          // --- UPDATED LOGIC HERE ---
          if (targetBidId && finalAmount !== null) {
            console.log(`[DB] Updating Bid ${targetBidId} to Submitted at $${finalAmount}`);
            await supabaseAdmin
              .from('bids')
              .update({
                status: 'Submitted',
                final_bid_amount: finalAmount,
                thread_id: threadId,
              })
              .eq('id', targetBidId);
          } else if (!targetBidId && finalAmount !== null) {
            // NEW: If no prior bid exists, create a brand new one as "Submitted"!
            console.log(`[DB] Creating NEW "Submitted" Bid for standalone submission...`);
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
              status: 'Submitted',
              final_bid_amount: finalAmount,
              email_received_at: receivedAt,
            });
          }
        }
      }

      // Mark email as processed
      await supabaseAdmin.from('processed_emails').insert({ email_id: msg.id, user_id: userId });
      console.log(`[Success] Finished processing Message ${msg.id}\n`);
    }

    console.log(`\n===========================================`);
    console.log(`Sync Complete`);
    console.log(`===========================================\n`);
  } catch (error) {
    console.error(`\n[FATAL ERROR] Failed to sync bids:`, error);
  }
};

import { oauth2Client } from '../../lib/google';
import { decodeBase64 } from '../../utils/string.utils';
import { parseBidEmail } from '../../utils/parser.utils';
import { getProjectFolderStructure } from './folder.helper';
import { getGmailClient, fetchMessages, extractEmailParts } from './gmail.helper';
import { downloadAndProcessAttachment } from './attachment.helper';
import {
  getUserTokensAndProfile,
  checkProcessedEmail,
  findExistingBidByThread,
  fuzzyFindBidByName,
  updateBid,
  createBid,
  markEmailAsProcessed,
  handleInvalidGrant,
} from './db.helper';

export const syncUserBids = async (userId: string) => {
  console.log(`\n===========================================`);
  console.log(`Starting Gmail Sync for User: ${userId}`);
  console.log(`===========================================\n`);

  try {
    const { tokenData, profileData } = await getUserTokensAndProfile(userId);

    if (!tokenData) throw new Error('No Google tokens found for user');

    const useDrive = profileData?.storage_preference === 'google_drive';
    const driveRootName = profileData?.drive_root_folder_name || 'Bid Tracker App';

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    const gmail = getGmailClient(oauth2Client);

    console.log(`[Gmail API] Fetching messages list...`);
    const messages = await fetchMessages(
      gmail,
      'smartbidnet.com OR buildingconnected.com OR (subject:("bid" OR "proposal") has:attachment in:sent)',
    );

    console.log(`[Gmail API] Found ${messages.length} potential messages.\n`);

    for (const msg of messages) {
      if (!msg.id || !msg.threadId) continue;

      const [existingEmail, existingThreadBid] = await Promise.all([
        checkProcessedEmail(msg.id),
        findExistingBidByThread(userId, msg.threadId),
      ]);

      if (existingEmail) {
        if (!useDrive || (existingThreadBid && existingThreadBid.drive_folder_id)) {
          console.log(`[Skip] Message ${msg.id} already processed.`);
          continue;
        }
        console.log(
          `[Retroactive Sync] Message ${msg.id} missing Drive files. Fetching attachments...`,
        );
      }

      console.log(`\n--- Fetching Full Detail for Message ${msg.id} ---`);
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });

      const threadId = msg.threadId;
      const isSentItem = detail.data.labelIds?.includes('SENT') || false;

      // NEW: Extract received date early so we can use it for both creations AND updates
      const receivedAt = detail.data.internalDate
        ? new Date(Number(detail.data.internalDate)).toISOString()
        : new Date().toISOString();

      const headers = detail.data.payload?.headers;
      const subjectHeader = headers?.find((h) => h.name?.toLowerCase() === 'subject');
      const subject = subjectHeader ? subjectHeader.value || '' : '';

      const payload = detail.data.payload;
      if (!payload) {
        console.log(`[Skip] Message ${msg.id} has no payload.`);
        continue;
      }

      const { encodedBody, attachments } = extractEmailParts(payload);

      if (!encodedBody && attachments.length === 0) {
        console.log(`[Skip] Could not extract text body OR attachments for message ${msg.id}`);
        continue;
      }

      const rawText = encodedBody ? decodeBase64(encodedBody) : '';
      const parsedData = parseBidEmail(rawText, subject, isSentItem);

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
          const { amount, url } = await downloadAndProcessAttachment(
            gmail,
            msg.id,
            att.attachmentId,
            att.filename,
            folders,
            useDrive,
            parsedData.email_type,
            finalBidAmount,
          );

          if (amount !== null && finalBidAmount === null) {
            finalBidAmount = amount;
          }

          if (url && !mainAttachmentUrl) {
            mainAttachmentUrl = url;
          }
        }
      }

      let targetBidId = existingThreadBid?.id;

      if (!targetBidId && parsedData.email_type === 'SUBMISSION') {
        console.log(
          `[DB] No Thread Match. Attempting fuzzy match for "${parsedData.project_name}"`,
        );
        const fallbackBid = await fuzzyFindBidByName(userId, parsedData.project_name);
        targetBidId = fallbackBid?.id;
        if (targetBidId)
          console.log(`[DB] Fuzzy match successful! Matched to: "${fallbackBid?.job_name}"`);
      }

      if (targetBidId) {
        console.log(`[DB] Updating existing Bid ${targetBidId} with latest info/links.`);
        const updateData: any = { thread_id: threadId };

        if (parsedData.email_type === 'SUBMISSION') {
          updateData.status = 'Submitted';
          updateData.bid_submitted_date = receivedAt; // NEW: Track submission time
          updateData.send_invite = true; // NEW: Auto-flag as actively bidding
          if (finalBidAmount !== null) updateData.final_bid_amount = finalBidAmount;
        }

        if (projectFolderId) updateData.drive_folder_id = projectFolderId;
        if (mainAttachmentUrl) updateData.attachment_url = mainAttachmentUrl;

        await updateBid(targetBidId, updateData);
      } else {
        console.log(`[DB] Creating NEW Bid...`);
        await createBid({
          user_id: userId,
          raw_email_id: msg.id,
          thread_id: threadId,
          general_contractor: parsedData.vendor_name,
          job_name: parsedData.project_name,
          bid_due_date: parsedData.due_date,
          status: parsedData.email_type === 'SUBMISSION' ? 'Submitted' : 'Needs Review',
          final_bid_amount: finalBidAmount,
          email_received_at: receivedAt,
          bid_submitted_date: parsedData.email_type === 'SUBMISSION' ? receivedAt : null, // NEW
          send_invite: parsedData.email_type === 'SUBMISSION' ? true : false, // NEW
          drive_folder_id: projectFolderId,
          attachment_url: mainAttachmentUrl,
        });
      }

      if (!existingEmail) {
        await markEmailAsProcessed(msg.id, userId);
      }
      console.log(`[Success] Finished processing Message ${msg.id}\n`);
    }

    console.log(`\n===========================================`);
    console.log(`Sync Complete`);
    console.log(`===========================================\n`);
  } catch (error: any) {
    console.error(`\n[FATAL ERROR] Failed to sync bids:`, error.message || error);
    if (error.message === 'invalid_grant' || error?.response?.data?.error === 'invalid_grant') {
      await handleInvalidGrant(userId);
      throw new Error('Gmail connection expired. Please reconnect your account in Settings.');
    }
    throw new Error('Failed to sync bids with Google.');
  }
};

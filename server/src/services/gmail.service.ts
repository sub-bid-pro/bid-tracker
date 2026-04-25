import { supabaseAdmin } from '../lib/supabase';
import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const decodeBase64 = (encodedStr: string) => {
  const buff = Buffer.from(encodedStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buff.toString('utf-8');
};

// Helper to strip out markdown asterisks and trim whitespace
const cleanString = (str: string) => {
  if (!str) return '';
  return str.replace(/\*/g, '').trim();
};

const parseBidEmail = (text: string) => {
  let project_name = 'Unknown Project';
  let vendor_name = 'Unknown General Contractor';
  let due_date = null;
  let summary = '';

  const summaryMatch = text.match(/(?:Message|Description|Project Description):\s*(.*?)(?=\r?\n)/i);
  if (summaryMatch) {
    summary = cleanString(summaryMatch[1]);
  }

  if (text.includes('smartbidnet.com')) {
    const projMatch = text.match(/Project:\s*(.*?)(?=\r?\n)/);
    if (projMatch) project_name = cleanString(projMatch[1]);

    const dateMatch = text.match(/Due Date:\s*(.*?)(?=\r?\n)/);
    if (dateMatch) due_date = cleanString(dateMatch[1]);

    const fromMatches = [...text.matchAll(/From:\s*(.*?)(?=\r?\n)/g)];
    if (fromMatches.length > 1) {
      vendor_name = cleanString(fromMatches[1][1].replace(/<.*?>/g, ''));
    } else if (fromMatches.length === 1) {
      vendor_name = cleanString(fromMatches[0][1].replace(/<.*?>/g, ''));
    }
  } else if (text.includes('buildingconnected.com')) {
    const projMatch = text.match(/message about\s*\r?\n\s*(.*?)(?=:|\r?\n)/);
    if (projMatch) project_name = cleanString(projMatch[1]);

    const dateMatch = text.match(/Bid Due:\s*(.*?)(?=\r?\n)/);
    if (dateMatch) due_date = cleanString(dateMatch[1]);

    const vendorMatch = text.match(/From:\s*([^<]+)/);
    if (vendorMatch) {
      vendor_name = cleanString(vendorMatch[1]);
    }
  } else if (text.includes('isqftmail.com')) {
    // Placeholder for future logic
  }

  return { project_name, vendor_name, due_date, summary };
};

export const syncUserBids = async (userId: string) => {
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

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'smartbidnet.com OR buildingconnected.com OR isqftmail.com',
      maxResults: 15,
    });

    console.log('Fetched messages estimate:', response.data.resultSizeEstimate);

    const messages = response.data.messages || [];

    for (const msg of messages) {
      if (!msg.id) continue;

      const { data: existingBid } = await supabaseAdmin
        .from('bids')
        .select('id')
        .eq('raw_email_id', msg.id)
        .single();

      if (existingBid) {
        console.log(`Skipping already processed message: ${msg.id}`);
        continue;
      }

      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });

      const payload = detail.data.payload;
      let encodedBody = '';

      if (payload?.parts && payload.parts.length > 0) {
        encodedBody = payload.parts[0].body?.data || '';
      } else if (payload?.body?.data) {
        encodedBody = payload.body.data;
      }

      if (!encodedBody) continue;

      const rawText = decodeBase64(encodedBody);
      const parsedData = parseBidEmail(rawText);

      // --- NEW: Capture Gmail's internal timestamp ---
      const internalDate = detail.data.internalDate;
      const receivedAt = internalDate
        ? new Date(Number(internalDate)).toISOString()
        : new Date().toISOString(); // Fallback to current time if missing

      // 5. Save the parsed data to Supabase
      const { error } = await supabaseAdmin.from('bids').insert({
        user_id: userId,
        raw_email_id: msg.id,
        general_contractor: parsedData.vendor_name,
        job_name: parsedData.project_name,
        bid_due_date: parsedData.due_date,
        summary: parsedData.summary,
        status: 'Needs Review',
        email_received_at: receivedAt,
      });

      if (error) {
        console.error('Error inserting bid:', error);
      } else {
        console.log(`Successfully synced bid: ${parsedData.project_name}`);
      }
    }
  } catch (error) {
    console.error(`Failed to sync bids for user ${userId}:`, error);
  }
};

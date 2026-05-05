import { google, gmail_v1 } from 'googleapis';

export interface Attachment {
  filename: string;
  attachmentId: string;
}

export const getGmailClient = (auth: any) => {
  return google.gmail({ version: 'v1', auth });
};

export const fetchMessages = async (gmail: gmail_v1.Gmail, query: string, maxResults: number = 25) => {
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  });
  return response.data.messages || [];
};

export const extractEmailParts = (payload: gmail_v1.Schema$MessagePart) => {
  let encodedBody = '';
  const attachments: Attachment[] = [];

  const extractParts = (parts: gmail_v1.Schema$MessagePart[]) => {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        encodedBody = part.body.data;
      } else if (part.filename?.toLowerCase().endsWith('.pdf') && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename!,
          attachmentId: part.body.attachmentId,
        });
        console.log(`[Attachment] Found PDF: ${part.filename}`);
      }

      if (part.parts) {
        extractParts(part.parts);
      }
    }
  };

  if (payload.parts) {
    extractParts(payload.parts);
  } else if (payload.body?.data) {
    encodedBody = payload.body.data;
  }

  return { encodedBody, attachments };
};

// @ts-ignore - Tell TypeScript to ignore the lack of type definitions
import pdfParse from 'pdf-parse';
import { gmail_v1 } from 'googleapis';
import { uploadAttachmentToDrive } from '../drive.service';
import { extractBidAmountFromPDF } from '../../utils/parser.utils';

export const downloadAndProcessAttachment = async (
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string,
  filename: string,
  folders: { typeFolderId: string } | null,
  useDrive: boolean,
  emailType: 'ITB' | 'SUBMISSION',
  currentAmount: number | null,
) => {
  console.log(`[Gmail API] Downloading Attachment ${attachmentId} (${filename})...`);
  const attachment = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });

  if (!attachment.data.data) return { amount: null, url: undefined };

  const pdfBuffer = Buffer.from(
    attachment.data.data.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  );

  let amount = null;
  let url = undefined;

  // 1. ALWAYS PARSE FOR AMOUNT (If it's a submission and we haven't found a price yet)
  if (emailType === 'SUBMISSION' && currentAmount === null) {
    let pdfDataText = '';
    try {
      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(pdfBuffer);
        pdfDataText = pdfData.text;
      } else if (pdfParse && typeof pdfParse.default === 'function') {
        const pdfData = await pdfParse.default(pdfBuffer);
        pdfDataText = pdfData.text;
      } else if (pdfParse && (pdfParse as any).PDFParse) {
        const parser = new (pdfParse as any).PDFParse({ data: pdfBuffer });
        const parsed = await parser.getText();
        pdfDataText = parsed.text || '';
        if (typeof parser.destroy === 'function') await parser.destroy();
      }

      if (pdfDataText) {
        amount = extractBidAmountFromPDF(pdfDataText);
      }
    } catch (err) {
      console.error('Failed to parse PDF for amount:', err);
    }
  }

  // 2. ONLY UPLOAD IF PREFERENCE IS SET
  if (useDrive && folders) {
    const driveFile = await uploadAttachmentToDrive(
      filename,
      'application/pdf',
      pdfBuffer,
      folders.typeFolderId,
    );
    console.log(`[Drive API] Uploaded successfully: ${driveFile.webViewLink}`);
    url = driveFile.webViewLink || undefined;
  }

  return { amount, url };
};

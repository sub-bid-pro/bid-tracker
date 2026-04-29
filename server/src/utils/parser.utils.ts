import { cleanString } from './string.utils';

export const parseBidEmail = (text: string, subject: string, isSentItem: boolean = false) => {
  console.log(`\n[Parser] Analyzing Email...`);
  console.log(`[Parser] Subject: "${subject}"`);
  console.log(`[Parser] Is Sent Folder: ${isSentItem}`);

  let project_name = 'Unknown Project';
  let vendor_name = 'Unknown General Contractor';
  let due_date = null;
  let summary = '';
  let email_type: 'ITB' | 'SUBMISSION' = 'ITB';

  const subjectLower = subject.toLowerCase();

  // 1. Better Submission Detection
  if (
    isSentItem ||
    text.includes('PROPOSAL SUBMITTED') ||
    subjectLower.includes('bid submitted') ||
    subjectLower.includes('bid delivered') ||
    subjectLower.includes('bid sent') ||
    subjectLower.includes('proposal sent') ||
    subjectLower.includes('bid revision')
  ) {
    email_type = 'SUBMISSION';
    console.log(`[Parser] Status: Determined as SUBMISSION`);
  } else {
    console.log(`[Parser] Status: Determined as ITB`);
  }

  // 2. Portal Extractors (SmartBid)
  if (text.includes('smartbidnet.com')) {
    console.log(`[Parser] Portal Detected: SmartBid`);
    const projMatch = text.match(/Project:\s*(.*?)(?=\r?\n)/);
    if (projMatch) project_name = cleanString(projMatch[1]);

    const dateMatch = text.match(/Due Date:\s*(.*?)(?=\r?\n)/);
    if (dateMatch) due_date = cleanString(dateMatch[1]);

    const fromMatches = [...text.matchAll(/From:\s*(.*?)(?=\r?\n)/g)];
    if (fromMatches.length > 0) {
      vendor_name = cleanString(fromMatches[0][1].replace(/<.*?>/g, ''));
    }
  }
  // Add BuildingConnected logic here...
  else {
    console.log(`[Parser] Portal Detected: NONE. Attempting Subject Line Fallback.`);

    // Expand the regex to strip colons, asterisks, and common GC buzzwords
    let cleanSubject = subject
      .replace(
        /(fwd|re|bid|proposal|sent|delivered|revision|invite|notice|due reminder|reminder to|extension|rfi|sharepoint link|walkthrough|submit asap|extention)[\s:]*/gi,
        '',
      )
      .replace(/[*:]/g, '') // strip literal asterisks and colons
      .trim();

    // Remove anything after a dash (e.g., "Arhaus - Ardmore, PA" -> "Arhaus")
    const dashSplit = cleanSubject.split('-');
    if (dashSplit.length > 1) {
      cleanSubject = dashSplit[0].trim();
    }

    if (cleanSubject.length > 3) {
      project_name = cleanSubject;
    }
  }

  console.log(`[Parser] Final Output -> Project: "${project_name}", Vendor: "${vendor_name}"`);
  return { project_name, vendor_name, due_date, summary, email_type };
};

export const extractBidAmountFromPDF = (pdfText: string): number | null => {
  console.log(`\n[PDF Parser] Scanning PDF text for dollar amounts...`);

  const moneyRegex = /\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g;
  const matches = [...pdfText.matchAll(moneyRegex)];

  if (matches.length === 0) {
    console.log(`[PDF Parser] WARNING: No dollar amounts found in PDF.`);
    return null;
  }

  const amounts = matches.map((match) => parseFloat(match[1].replace(/,/g, '')));
  console.log(`[PDF Parser] Found amounts:`, amounts);

  const finalAmount = Math.max(...amounts);
  console.log(`[PDF Parser] Selected highest amount: $${finalAmount}`);

  return finalAmount;
};

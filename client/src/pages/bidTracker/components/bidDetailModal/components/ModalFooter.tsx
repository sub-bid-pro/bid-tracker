import { useMemo } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useToast } from '../../../../../contexts/ToastContext';
import { BID_SECTIONS_CONFIG } from './ModalConfig';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bid: any;
  onClose: () => void;
  onEdit: () => void;
}

export const ModalFooter = ({ bid, onClose, onEdit }: Props) => {
  const { showToast } = useToast();

  const gmailLink = useMemo(
    () => (bid.thread_id ? `https://mail.google.com/mail/u/0/#all/${bid.thread_id}` : null),
    [bid.thread_id],
  );

  const driveLink = useMemo(
    () =>
      bid.drive_folder_link ||
      (bid.drive_folder_id
        ? `https://drive.google.com/drive/folders/${bid.drive_folder_id}`
        : null),
    [bid.drive_folder_link, bid.drive_folder_id],
  );

  const handleCopyCSV = () => {
    const headers = ['Field', 'Value'];

    // 1. Manually push Status since it lives in the header, not the sections
    const data: string[][] = [['Status', bid.status || '']];

    // 2. DYNAMICALLY loop through every section and field in our configuration!
    Object.values(BID_SECTIONS_CONFIG).forEach((section) => {
      section.fields.forEach((field) => {
        data.push([field.label, String(field.getValue(bid) || '')]);
      });
    });

    // 3. Append the Footer Links
    data.push(
      ['Gmail Thread', gmailLink || ''],
      ['Attachment URL', bid.attachment_url || ''],
      ['Portal Link', bid.portal_link || ''],
      ['Drive Link', driveLink || ''],
    );

    const escapeCSV = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...data.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    navigator.clipboard.writeText(csvContent);
    showToast('Bid details copied to clipboard as CSV!', 'success');
  };

  return (
    <div className="modal-actions">
      <div className="footer-links">
        {gmailLink && (
          <a href={gmailLink} target="_blank" rel="noreferrer" className="footer-link-btn">
            <EmailIcon sx={{ fontSize: 18 }} />
            <span>Gmail</span>
          </a>
        )}
        {bid.attachment_url && (
          <a href={bid.attachment_url} target="_blank" rel="noreferrer" className="footer-link-btn">
            <AttachFileIcon sx={{ fontSize: 18 }} />
            <span>PDF</span>
          </a>
        )}
        {bid.portal_link && (
          <a href={bid.portal_link} target="_blank" rel="noreferrer" className="footer-link-btn">
            <OpenInNewIcon sx={{ fontSize: 18 }} />
            <span>Portal</span>
          </a>
        )}
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="footer-link-btn">
            <FolderSharedIcon sx={{ fontSize: 18 }} />
            <span>Drive</span>
          </a>
        )}
      </div>

      <div className="footer-main-actions">
        <button className="copy-csv-btn" onClick={handleCopyCSV}>
          <ContentCopyIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Copy CSV
        </button>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
        <button className="edit-btn" onClick={onEdit}>
          Edit Full Details
        </button>
      </div>
    </div>
  );
};

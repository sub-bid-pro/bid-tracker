import { useMemo } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FolderSharedIcon from '@mui/icons-material/FolderShared';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bid: any;
  onClose: () => void;
  onEdit: () => void;
}

export const ModalFooter = ({ bid, onClose, onEdit }: Props) => {
  const gmailLink = useMemo(
    () => (bid.thread_id ? `https://mail.google.com/mail/u/0/#all/${bid.thread_id}` : null),
    [bid.thread_id],
  );

  const driveLink = useMemo(
    () =>
      bid.drive_folder_link ||
      (bid.drive_folder_id ? `https://drive.google.com/drive/folders/${bid.drive_folder_id}` : null),
    [bid.drive_folder_link, bid.drive_folder_id],
  );

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
          <a
            href={bid.attachment_url}
            target="_blank"
            rel="noreferrer"
            className="footer-link-btn"
          >
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

interface Props {
  onClose: () => void;
  onEdit: () => void;
}

export const ModalFooter = ({ onClose, onEdit }: Props) => {
  return (
    <div className="modal-actions">
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
      <button className="edit-btn" onClick={onEdit}>
        Edit Full Details
      </button>
    </div>
  );
};

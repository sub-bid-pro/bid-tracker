import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onClose, useEscapeKey } from '../../../../components/modals/utils';
import { ModalFooter } from './components/ModalFooter';
import { ModalHeader } from './components/ModalHeader';
import { SummaryBlock, DynamicSection } from './components/ModalSections';
import './styles.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bid: any;
  handleModal: () => void;
}

export const BidDetailModal = ({ bid, handleModal }: Props) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  useEscapeKey(() => onClose(setIsClosing, handleModal));

  const handleEdit = () => navigate(`/bids/${bid.id}/edit`);
  const handleClose = () => onClose(setIsClosing, handleModal);

  return (
    <div className={`modal-overlay ${isClosing ? 'is-closing' : ''}`} onClick={handleClose}>
      <div
        className={`modal-content ${isClosing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader jobName={bid.job_name} status={bid.status} />

        <div className="modal-body">
          <SummaryBlock summary={bid.summary} />

          {/* TWO COLUMN DESKTOP LAYOUT */}
          <div className="modal-columns">
            <div className="column">
              <DynamicSection configKey="core" bid={bid} />
              <DynamicSection configKey="metadata" bid={bid} />
            </div>

            <div className="column">
              <DynamicSection configKey="financials" bid={bid} />
              <DynamicSection configKey="dates" bid={bid} />
            </div>
          </div>
        </div>

        <ModalFooter bid={bid} onClose={handleClose} onEdit={handleEdit} />
      </div>
    </div>
  );
};

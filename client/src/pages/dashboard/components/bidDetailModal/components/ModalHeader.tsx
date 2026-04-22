import { StatusBadge } from '../../../../../components/statusBadge/StatusBadge';

interface Props {
  jobName: string;
  status: string;
}

export const ModalHeader = ({ jobName, status }: Props) => {
  return (
    <div className="modal-header">
      <h2>{jobName || 'Unnamed Project'}</h2>
      <StatusBadge status={status} />
    </div>
  );
};

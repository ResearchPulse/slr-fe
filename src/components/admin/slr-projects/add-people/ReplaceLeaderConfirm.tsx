import ConfirmModal from "../../../ui/ConfirmModal";

interface ReplaceLeaderConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  selectedUserName?: string;
}

export default function ReplaceLeaderConfirm({
  isOpen,
  onConfirm,
  onCancel,
  selectedUserName,
}: ReplaceLeaderConfirmProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Chuyển quyền Trưởng nhóm?"
      message={
        <>
          Chuyển vai trò Project Leader cho{" "}
          <span className="font-semibold text-text-primary">
            {selectedUserName || "thành viên này"}
          </span>
          . Trưởng nhóm hiện tại sẽ chuyển về vai trò Reviewer.
        </>
      }
      confirmText="Xác nhận chuyển quyền"
      cancelText="Quay lại"
      variant="warning"
      closeOnOutsideClick={false}
    />
  );
}

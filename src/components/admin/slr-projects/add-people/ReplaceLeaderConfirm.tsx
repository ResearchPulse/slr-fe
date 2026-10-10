import { FiAlertTriangle } from "react-icons/fi";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-(--z-index-modal) flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-surface-white rounded-xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
        <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-6">
          <FiAlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-text-primary tracking-tight leading-tight">
            Chuyển quyền Trưởng nhóm?
          </h4>
          <p className="text-sm text-text-secondary font-medium leading-relaxed">
            Chuyển vai trò Project Leader cho{" "}
            <span className="text-accent font-bold">{selectedUserName}</span>.{" "}
            Trưởng nhóm hiện tại sẽ được chuyển về vai trò Reviewer.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition-all active:scale-95 uppercase tracking-widest shadow-none shadow-amber-100"
          >
            Xác nhận chuyển quyền
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 text-xs font-black rounded-xl text-text-muted hover:text-text-secondary transition-all uppercase tracking-widest"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

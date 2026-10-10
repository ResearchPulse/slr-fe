import { useState } from "react";
import { FiTag } from "react-icons/fi";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface NameFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isLoading: boolean;
  title?: string;
  placeholder?: string;
  initialValue?: string;
}

export default function NameFilterModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title = "Name your filter collection",
  placeholder = "e.g., My Research View",
  initialValue = "",
}: NameFilterModalProps) {
  const [name, setName] = useState(initialValue);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(name.trim())}
            isLoading={isLoading}
            disabled={!name.trim()}
          >
            Save Collection
          </Button>
        </>
      }
    >
      <div className="relative group">
        <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border border-border bg-surface-white py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full pl-11 pr-4 text-text-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          }}
        />
      </div>
    </Modal>
  );
}

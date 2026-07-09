import type { ReactNode } from "react";
import Modal from "@/components/Modal";

interface ConfirmModalProps {
  title: string;
  confirmLabel: string;
  children: ReactNode;
  isClosing: boolean;
  onClosed: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal = ({
  title,
  confirmLabel,
  children,
  isClosing,
  onClosed,
  onClose,
  onConfirm,
}: ConfirmModalProps) => (
  <Modal
    title={title}
    className="th-modal"
    onClose={onClose}
    isClosing={isClosing}
    onClosed={onClosed}
  >
    <p className="th-confirm-text">{children}</p>
    <div className="th-modal-actions">
      <button className="th-cancel" onClick={onClose}>
        Cancel
      </button>
      <button className="th-delete" onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

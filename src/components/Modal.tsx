import { useEffect, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";
import "@/styles/components/Modal.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string; // for per-tool styling
  // Set by a parent using useExitTransition to fade the modal out before it unmounts.
  isClosing?: boolean;
  onClosed?: () => void;
}

const Modal = ({ title, onClose, children, className, isClosing = false, onClosed }: ModalProps) => {
  useEffect(() => {
    // Listen in the capture phase + stop the event so an open modal takes Esc before the tool window to close the modal alone.
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [onClose]);

  // Fade-out plays on the overlay. Once it ends, tell parent to unmount.
  const handleAnimationEnd: React.AnimationEventHandler<HTMLDivElement> = (event) => {
    if (isClosing && event.target === event.currentTarget) onClosed?.();
  };

  return (
    <div
      className={`modal-overlay${isClosing ? " is-closing" : ""}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={`modal-panel${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <IconX size={20} stroke={1.5} />
        </button>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

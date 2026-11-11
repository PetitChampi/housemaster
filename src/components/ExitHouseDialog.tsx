import { useEffect, useRef } from "react";

const ExitHouseDialog = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="exit-house-dialog"
      aria-labelledby="exit-house-title"
      aria-describedby="exit-house-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="exit-house-content">
        <h2 id="exit-house-title">Leave the house?</h2>
        <p id="exit-house-description">Would you like to log out and return to the login screen?</p>
        <div className="exit-house-actions">
          <button type="button" autoFocus onClick={onClose}>Stay inside</button>
          <button type="button" className="exit-house-confirm" onClick={onConfirm}>Log out</button>
        </div>
      </div>
    </dialog>
  );
};

export default ExitHouseDialog;

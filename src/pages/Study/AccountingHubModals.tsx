import { useState, type SyntheticEvent } from "react";
import Modal from "@/components/Modal";
import { linkIcons, defaultLinkIcon, type AccountingLink } from "@/pages/Study/accountingHubData";

type LinkFormData = Omit<AccountingLink, "id">;

interface ModalTransitionProps {
  isClosing?: boolean;
  onClosed?: () => void;
}

interface LinkFormModalProps extends ModalTransitionProps {
  mode: "add" | "edit";
  initial?: AccountingLink;
  onClose: () => void;
  onSubmit: (data: LinkFormData) => void;
}

export const LinkFormModal = ({
  mode,
  initial,
  onClose,
  onSubmit,
  isClosing,
  onClosed,
}: LinkFormModalProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? defaultLinkIcon);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onSubmit({ name: name.trim(), url: url.trim(), icon });
  };

  const title = mode === "add" ? "New link" : "Edit link";
  const submitLabel = mode === "add" ? "Add link" : "Edit link";

  return (
    <Modal title={title} onClose={onClose} className="ah-modal" isClosing={isClosing} onClosed={onClosed}>
      <form className="ah-form" onSubmit={handleSubmit}>
        <div className="ah-field">
          <label htmlFor="ah-name">Link name</label>
          <input
            id="ah-name"
            className="ah-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="ah-field">
          <label htmlFor="ah-url">Link URL</label>
          <input
            id="ah-url"
            className="ah-input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <div className="ah-field">
          <span className="ah-field-label">Icon</span>
          <div className="ah-icon-grid">
            {linkIcons.map(({ key, Icon }) => (
              <button
                type="button"
                key={key}
                className={`ah-icon-option ${icon === key ? "is-selected" : ""}`}
                aria-label={key}
                onClick={() => setIcon(key)}
              >
                <Icon size={22} stroke={1} />
              </button>
            ))}
          </div>
        </div>
        <div className="ah-modal-actions">
          <button type="button" className="ah-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ah-submit" disabled={!name.trim() || !url.trim()}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface ConfirmDeleteLinkModalProps extends ModalTransitionProps {
  linkName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteLinkModal = ({
  linkName,
  onClose,
  onConfirm,
  isClosing,
  onClosed,
}: ConfirmDeleteLinkModalProps) => (
  <Modal title="Delete link" onClose={onClose} className="ah-modal" isClosing={isClosing} onClosed={onClosed}>
    <p className="ah-confirm-text">
      Are you sure you want to remove &ldquo;{linkName}&rdquo;? This can&rsquo;t be undone.
    </p>
    <div className="ah-modal-actions">
      <button type="button" className="ah-cancel" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="ah-delete" onClick={onConfirm}>
        Delete link
      </button>
    </div>
  </Modal>
);

import { useState, type SyntheticEvent } from "react";
import { IconBan } from "@tabler/icons-react";
import Modal from "@/components/Modal";
import { linkIcons, type AccountingLink } from "@/pages/Study/accountingLinksData";

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
  const [icon, setIcon] = useState<string | undefined>(initial?.icon);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onSubmit({ name: name.trim(), url: url.trim(), icon });
  };

  const title = mode === "add" ? "New link" : "Edit link";
  const submitLabel = mode === "add" ? "Add link" : "Edit link";

  return (
    <Modal title={title} onClose={onClose} className="al-modal" isClosing={isClosing} onClosed={onClosed}>
      <form className="al-form" onSubmit={handleSubmit}>
        <div className="al-field">
          <label htmlFor="al-name">Link name</label>
          <input
            id="al-name"
            className="al-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="al-field">
          <label htmlFor="al-url">Link URL</label>
          <input
            id="al-url"
            className="al-input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <div className="al-field">
          <span className="al-field-label">Icon (optional)</span>
          <div className="al-icon-grid">
            <button
              type="button"
              className={`al-icon-option ${icon ? "" : "is-selected"}`}
              aria-label="No icon"
              onClick={() => setIcon(undefined)}
            >
              <IconBan size={22} stroke={1} />
            </button>
            {linkIcons.map(({ key, Icon }) => (
              <button
                type="button"
                key={key}
                className={`al-icon-option ${icon === key ? "is-selected" : ""}`}
                aria-label={key}
                onClick={() => setIcon(key)}
              >
                <Icon size={22} stroke={1} />
              </button>
            ))}
          </div>
        </div>
        <div className="al-modal-actions">
          <button type="button" className="al-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="al-submit" disabled={!name.trim() || !url.trim()}>
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
  <Modal title="Delete link" onClose={onClose} className="al-modal" isClosing={isClosing} onClosed={onClosed}>
    <p className="al-confirm-text">
      Are you sure you want to remove &ldquo;{linkName}&rdquo;? This can&rsquo;t be undone.
    </p>
    <div className="al-modal-actions">
      <button type="button" className="al-cancel" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="al-delete" onClick={onConfirm}>
        Delete link
      </button>
    </div>
  </Modal>
);

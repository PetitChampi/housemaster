import { useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import Modal from "@/components/Modal";
import { kindConfig, type SectionKind, type SnoozeItem } from "@/pages/Bedroom/snoozeBuddyData";

type ItemFormData = Omit<SnoozeItem, "id">;

// parent drives shared fade-out via useExitTransition
interface ModalTransitionProps {
  isClosing?: boolean;
  onClosed?: () => void;
}

interface ItemFormModalProps extends ModalTransitionProps {
  mode: "add" | "edit";
  kind: SectionKind;
  initial?: SnoozeItem;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
}

export const ItemFormModal = ({
  mode,
  kind,
  initial,
  onClose,
  onSubmit,
  isClosing,
  onClosed,
}: ItemFormModalProps) => {
  const cfg = kindConfig[kind];
  const [name, setName] = useState(initial?.name ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [pictureUrl, setPictureUrl] = useState<string | undefined>(initial?.pictureUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // read img into a data URL so the preview and saved item share one value, with no upload backend yet
  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPictureUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), link: link.trim(), pictureUrl });
  };

  const title = mode === "add" ? cfg.newTitle : cfg.editTitle;
  const submitLabel = mode === "add" ? cfg.addLabel : `Edit ${cfg.noun}`;

  return (
    <Modal title={title} onClose={onClose} className="sb-modal" isClosing={isClosing} onClosed={onClosed}>
      <form className="sb-form" onSubmit={handleSubmit}>
        <div className="sb-field">
          <label htmlFor="sb-item-name">{cfg.nameLabel}</label>
          <input
            id="sb-item-name"
            className="sb-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>

        <div className="sb-field">
          <label htmlFor="sb-item-link">{cfg.linkLabel}</label>
          <input
            id="sb-item-link"
            className="sb-input"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
        </div>

        <div className="sb-field">
          <span className="sb-field-label">{cfg.pictureLabel}</span>
          <div className="sb-picture">
            {pictureUrl && (
              <span className="sb-picture-preview">
                <img src={pictureUrl} alt="" />
              </span>
            )}
            <button
              type="button"
              className="sb-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {pictureUrl ? "Replace" : "Upload file"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePick}
            />
          </div>
        </div>

        <div className="sb-modal-actions">
          <button type="button" className="sb-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="sb-submit" disabled={!name.trim()}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface ConfirmDeleteModalProps extends ModalTransitionProps {
  kind: SectionKind;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal = ({
  kind,
  itemName,
  onClose,
  onConfirm,
  isClosing,
  onClosed,
}: ConfirmDeleteModalProps) => {
  const cfg = kindConfig[kind];
  return (
    <Modal
      title={`Delete ${cfg.noun}`}
      onClose={onClose}
      className="sb-modal"
      isClosing={isClosing}
      onClosed={onClosed}
    >
      <p className="sb-confirm-text">
        Are you sure you want to remove &ldquo;{itemName}&rdquo;? This can&rsquo;t be undone.
      </p>
      <div className="sb-modal-actions">
        <button type="button" className="sb-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="sb-delete" onClick={onConfirm}>
          Delete {cfg.noun}
        </button>
      </div>
    </Modal>
  );
};

interface NewSectionModalProps extends ModalTransitionProps {
  onClose: () => void;
  onSubmit: (data: { title: string; kind: SectionKind }) => void;
}

export const NewSectionModal = ({ onClose, onSubmit, isClosing, onClosed }: NewSectionModalProps) => {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SectionKind>("youtube");

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), kind });
  };

  const kinds: { value: SectionKind; label: string }[] = [
    { value: "youtube", label: "YouTube channels" },
    { value: "podcast", label: "Podcasts" },
  ];

  return (
    <Modal title="New section" onClose={onClose} className="sb-modal" isClosing={isClosing} onClosed={onClosed}>
      <form className="sb-form" onSubmit={handleSubmit}>
        <div className="sb-field">
          <label htmlFor="sb-section-name">Section name</label>
          <input
            id="sb-section-name"
            className="sb-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
        </div>

        <div className="sb-field">
          <span className="sb-field-label">Content type</span>
          <div className="sb-kind-choice">
            {kinds.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`sb-kind-option ${kind === option.value ? "is-selected" : ""}`}
                onClick={() => setKind(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sb-modal-actions">
          <button type="button" className="sb-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="sb-submit" disabled={!title.trim()}>
            Create section
          </button>
        </div>
      </form>
    </Modal>
  );
};

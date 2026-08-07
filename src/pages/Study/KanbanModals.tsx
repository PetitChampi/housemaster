import { useState, type ReactNode, type SyntheticEvent } from "react";
import { IconPlus, IconTrash, IconSquareCheck, IconX } from "@tabler/icons-react";
import Modal from "@/components/Modal";
import { checklistProgress, progressTier } from "@/pages/Study/kanbanLogic";
import {
  MAX_CHECKLISTS_PER_CARD,
  MAX_ITEMS_PER_CHECKLIST,
  type Board,
  type Card,
  type Checklist,
} from "@/pages/Study/kanbanData";

interface ModalTransitionProps {
  isClosing?: boolean;
  onClosed?: () => void;
}

interface CardModalProps extends ModalTransitionProps {
  card: Card;
  onChange: (card: Card) => void;
  onDelete: () => void;
  onClose: () => void;
}

// Edits apply as they are made, the way a card behaves in Trello, so no save step to forget
export const CardModal = ({ card, onChange, onDelete, onClose, isClosing, onClosed }: CardModalProps) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const patchChecklist = (checklistId: string, patch: Partial<Checklist>) =>
    onChange({
      ...card,
      checklists: card.checklists.map((entry) =>
        entry.id === checklistId ? { ...entry, ...patch } : entry
      ),
    });

  const addChecklist = () =>
    onChange({
      ...card,
      checklists: [...card.checklists, { id: crypto.randomUUID(), title: "Checklist", items: [] }],
    });

  const removeChecklist = (checklistId: string) =>
    onChange({ ...card, checklists: card.checklists.filter((entry) => entry.id !== checklistId) });

  const addItem = (checklist: Checklist) => {
    const text = (drafts[checklist.id] ?? "").trim();
    if (!text || checklist.items.length >= MAX_ITEMS_PER_CHECKLIST) return;
    patchChecklist(checklist.id, {
      items: [...checklist.items, { id: crypto.randomUUID(), text, done: false }],
    });
    setDrafts((prev) => ({ ...prev, [checklist.id]: "" }));
  };

  const toggleItem = (checklist: Checklist, itemId: string) =>
    patchChecklist(checklist.id, {
      items: checklist.items.map((entry) =>
        entry.id === itemId ? { ...entry, done: !entry.done } : entry
      ),
    });

  const removeItem = (checklist: Checklist, itemId: string) =>
    patchChecklist(checklist.id, { items: checklist.items.filter((entry) => entry.id !== itemId) });

  const atChecklistLimit = card.checklists.length >= MAX_CHECKLISTS_PER_CARD;

  return (
    <Modal
      title="Edit card"
      className="kb-modal kb-card-modal"
      onClose={onClose}
      isClosing={isClosing}
      onClosed={onClosed}
    >
      <div className="kb-fields">
        <div className="kb-field">
          <label className="kb-label" htmlFor="kb-card-title">
            Title
          </label>
          <input
            id="kb-card-title"
            className="kb-input"
            value={card.title}
            placeholder="Untitled card"
            autoFocus
            onChange={(event) => onChange({ ...card, title: event.target.value })}
          />
        </div>
        <div className="kb-field">
          <label className="kb-label" htmlFor="kb-card-description">
            Description
          </label>
          <textarea
            id="kb-card-description"
            className="kb-input kb-textarea"
            value={card.description}
            placeholder="Add a little more detail…"
            onChange={(event) => onChange({ ...card, description: event.target.value })}
          />
        </div>
      </div>

      <div className="kb-checklists">
        {card.checklists.map((checklist) => {
          const { done, total, percent } = checklistProgress(checklist);
          return (
            <section className="kb-checklist" key={checklist.id}>
              <div className="kb-checklist-head">
                <input
                  className="kb-checklist-title"
                  value={checklist.title}
                  placeholder="Checklist"
                  aria-label="Checklist title"
                  onChange={(event) => patchChecklist(checklist.id, { title: event.target.value })}
                />
                <span className={`kb-tag is-${progressTier(percent)}`}>
                  <IconSquareCheck size={13} stroke={2} />
                  {done}/{total} &middot; {percent}%
                </span>
                <button
                  className="kb-icon-btn kb-icon-btn--danger"
                  aria-label={`Delete ${checklist.title || "checklist"}`}
                  data-tooltip="Delete checklist"
                  data-tooltip-dir="left"
                  onClick={() => removeChecklist(checklist.id)}
                >
                  <IconTrash size={16} stroke={1.5} />
                </button>
              </div>
              <ul className="kb-checklist-items">
                {checklist.items.map((entry) => (
                  <li key={entry.id}>
                    <label className={`kb-check-item${entry.done ? " is-done" : ""}`}>
                      <input
                        type="checkbox"
                        checked={entry.done}
                        onChange={() => toggleItem(checklist, entry.id)}
                      />
                      <span className="kb-checkbox" aria-hidden="true" />
                      <span className="kb-check-text">{entry.text}</span>
                    </label>
                    <button
                      className="kb-icon-btn kb-icon-btn--danger"
                      aria-label={`Remove ${entry.text}`}
                      onClick={() => removeItem(checklist, entry.id)}
                    >
                      <IconX size={15} stroke={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
              {checklist.items.length < MAX_ITEMS_PER_CHECKLIST ? (
                <form
                  className="kb-checklist-add"
                  onSubmit={(event: SyntheticEvent) => {
                    event.preventDefault();
                    addItem(checklist);
                  }}
                >
                  <input
                    className="kb-input kb-input--sm"
                    value={drafts[checklist.id] ?? ""}
                    placeholder="Add an item…"
                    aria-label="New checklist item"
                    onChange={(event) =>
                      setDrafts((prev) => ({ ...prev, [checklist.id]: event.target.value }))
                    }
                  />
                  <button className="kb-btn kb-btn-ghost" type="submit" disabled={!(drafts[checklist.id] ?? "").trim()}>
                    Add
                  </button>
                </form>
              ) : (
                <p className="kb-limit">This checklist is full ({MAX_ITEMS_PER_CHECKLIST} items).</p>
              )}
            </section>
          );
        })}
        <button
          className="kb-btn kb-btn-ghost kb-add-checklist"
          disabled={atChecklistLimit}
          data-tooltip={atChecklistLimit ? `Limit of ${MAX_CHECKLISTS_PER_CARD} checklists reached` : undefined}
          onClick={addChecklist}
        >
          <IconPlus size={16} stroke={1.75} />
          Add checklist
        </button>
      </div>

      <div className="kb-modal-actions">
        <button className="kb-btn kb-btn-danger" onClick={onDelete}>
          <IconTrash size={16} stroke={1.5} />
          Delete card
        </button>
        <button className="kb-btn kb-btn-strong" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
};

interface BoardFormModalProps extends ModalTransitionProps {
  initial?: Board;
  onSubmit: (title: string, description: string) => void;
  onClose: () => void;
}

export const BoardFormModal = ({
  initial,
  onSubmit,
  onClose,
  isClosing,
  onClosed,
}: BoardFormModalProps) => {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), description.trim());
  };

  return (
    <Modal
      title={initial ? "Edit board" : "New board"}
      className="kb-modal"
      onClose={onClose}
      isClosing={isClosing}
      onClosed={onClosed}
    >
      <form className="kb-fields" onSubmit={handleSubmit}>
        <div className="kb-field">
          <label className="kb-label" htmlFor="kb-board-title">
            Board title
          </label>
          <input
            id="kb-board-title"
            className="kb-input"
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="kb-field">
          <label className="kb-label" htmlFor="kb-board-description">
            Description
          </label>
          <textarea
            id="kb-board-description"
            className="kb-input kb-textarea"
            value={description}
            placeholder="What is this board for?"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="kb-modal-actions">
          <button className="kb-btn kb-btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="kb-btn kb-btn-strong" type="submit" disabled={!title.trim()}>
            {initial ? "Save changes" : "Create board"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface ConfirmModalProps extends ModalTransitionProps {
  title: string;
  confirmLabel: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal = ({
  title,
  confirmLabel,
  children,
  onConfirm,
  onClose,
  isClosing,
  onClosed,
}: ConfirmModalProps) => (
  <Modal title={title} className="kb-modal" onClose={onClose} isClosing={isClosing} onClosed={onClosed}>
    <p className="kb-confirm-text">{children}</p>
    <div className="kb-modal-actions">
      <button className="kb-btn kb-btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button className="kb-btn kb-btn-danger-strong" onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import {
  IconAlignLeft,
  IconArrowLeft,
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconDots,
  IconLayoutKanban,
  IconPencil,
  IconPlus,
  IconSquareCheck,
  IconTrash,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import { useCurrentUser } from "@/store/authStore";
import { useExitTransition } from "@/lib/useExitTransition";
import { usePointerDrag } from "@/lib/usePointerDrag";
import { BoardFormModal, CardModal, ConfirmModal } from "@/pages/Study/KanbanModals";
import {
  cardsForList,
  checklistProgress,
  deleteBoard,
  deleteList,
  listsForBoard,
  moveCard,
  moveList,
  progressTier,
  shiftList,
} from "@/pages/Study/kanbanLogic";
import {
  MAX_BOARDS,
  MAX_CARDS_PER_LIST,
  MAX_LISTS_PER_BOARD,
  loadKanban,
  saveKanban,
  type Board,
  type Card,
  type KanbanState,
} from "@/pages/Study/kanbanData";
import "@/styles/tools/Kanban.css";

type DragPayload =
  | { kind: "card"; cardId: string; listId: string }
  | { kind: "list"; listId: string };

type DropTarget = { kind: "card"; listId: string; index: number } | { kind: "list"; index: number };

function insertionIndex(items: Element[], point: number, axis: "x" | "y"): number {
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const middle = axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
    if (point < middle) return i;
  }
  return items.length;
}

type ActiveModal =
  | { kind: "card"; id: string }
  | { kind: "board-form"; board?: Board }
  | { kind: "delete-board"; board: Board }
  | { kind: "delete-list"; listId: string; title: string; count: number };

interface MenuEntry {
  label: string;
  Icon: Icon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface InlineTitleProps {
  value: string;
  onCommit: (value: string) => void;
  className: string;
  label: string;
}

interface DotMenuProps {
  id: string;
  openId: string | null;
  onToggle: (id: string | null) => void;
  label: string;
  entries: MenuEntry[];
}

const dataset = (element: Element | null, key: string) =>
  element instanceof HTMLElement ? element.dataset[key] ?? null : null;

// Click the text to turn it into an input, commit on blur
const InlineTitle = ({ value, onCommit, className, label }: InlineTitleProps) => {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button className={className} aria-label={`${label}: ${value}`} onClick={() => setEditing(true)}>
        {value}
      </button>
    );
  }
  return (
    <input
      className={`${className} kb-inline-input`}
      defaultValue={value}
      aria-label={label}
      autoFocus
      onFocus={(event: SyntheticEvent<HTMLInputElement>) => event.currentTarget.select()}
      onBlur={(event: SyntheticEvent<HTMLInputElement>) => {
        onCommit(event.currentTarget.value.trim() || value);
        setEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.currentTarget.value = value;
          event.currentTarget.blur();
        }
      }}
    />
  );
};

const DotMenu = ({ id, openId, onToggle, label, entries }: DotMenuProps) => (
  <div className="kb-menu">
    <button
      className="kb-icon-btn"
      aria-label={label}
      aria-expanded={openId === id}
      onClick={() => onToggle(openId === id ? null : id)}
    >
      <IconDots size={18} stroke={1.5} />
    </button>
    {openId === id && (
      <div className="kb-menu-pop">
        {entries.map((entry) => (
          <button
            key={entry.label}
            className={`kb-menu-item${entry.danger ? " is-danger" : ""}`}
            disabled={entry.disabled}
            onClick={() => {
              onToggle(null);
              entry.onSelect();
            }}
          >
            <entry.Icon size={16} stroke={1.5} />
            {entry.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

const KanbanBoard = () => {
  const user = useCurrentUser();
  const [state, setState] = useState<KanbanState>(loadKanban);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [modal, setModal] = useState<ActiveModal | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [composing, setComposing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [listDraft, setListDraft] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragPayload | null>(null);

  const { rendered: activeModal, isClosing, onClosed } = useExitTransition(modal);

  useEffect(() => saveKanban(state), [state]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".kb-menu")) setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenu]);

  const board = state.boards.find((entry) => entry.id === activeBoardId) ?? null;
  const lists = board ? listsForBoard(state.lists, board.id) : [];

  const drag = usePointerDrag<DragPayload, DropTarget>({
    originRef: rootRef,
    resolveTarget: (element, x, y) => {
      const dragged = dragRef.current;
      if (!dragged) return null;

      if (dragged.kind === "list") {
        const canvas = element.closest(".kb-canvas");
        if (!canvas) return null;
        const columns = [...canvas.querySelectorAll("[data-list-id]")];
        return { kind: "list", index: insertionIndex(columns, x, "x") };
      }

      const listEl = element.closest("[data-list-id]");
      const listId = dataset(listEl, "listId");
      if (!listEl || !listId) return null;
      const cards = [...listEl.querySelectorAll("[data-card-id]")];
      return { kind: "card", listId, index: insertionIndex(cards, y, "y") };
    },
    onDrop: (payload, target) => {
      dragRef.current = null;
      if (!target || !activeBoardId) return;
      setState((prev) => {
        if (payload.kind === "list") {
          if (target.kind !== "list") return prev;
          return { ...prev, lists: moveList(prev.lists, activeBoardId, payload.listId, target.index) };
        }
        if (target.kind !== "card") return prev;
        return { ...prev, cards: moveCard(prev.cards, payload.cardId, target.listId, target.index) };
      });
    },
  });

  const beginDrag = (event: React.PointerEvent, payload: DragPayload) => {
    dragRef.current = payload;
    drag.start(event, payload);
  };

  const patchBoard = (id: string, patch: Partial<Board>) =>
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));

  const patchCard = (next: Card) =>
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((entry) => (entry.id === next.id ? next : entry)),
    }));

  const saveBoard = (title: string, description: string, existing?: Board) => {
    if (existing) patchBoard(existing.id, { title, description });
    else {
      const id = crypto.randomUUID();
      setState((prev) => ({ ...prev, boards: [...prev.boards, { id, title, description }] }));
    }
    setModal(null);
  };

  const addList = (title: string) => {
    if (!board) return;
    setState((prev) => ({
      ...prev,
      lists: [...prev.lists, { id: crypto.randomUUID(), boardId: board.id, title }],
    }));
    setListDraft(null);
  };

  const addCard = (listId: string, title: string) => {
    setState((prev) => ({
      ...prev,
      cards: [...prev.cards, { id: crypto.randomUUID(), listId, title, description: "", checklists: [] }],
    }));
    setDraft("");
  };

  const removeCard = (cardId: string) => {
    setState((prev) => ({ ...prev, cards: prev.cards.filter((entry) => entry.id !== cardId) }));
    setModal(null);
  };

  // placeholder location in a given list (null when nothing is hovering it)
  const slotIndex = (listId: string): number | null => {
    const target = drag.target;
    if (drag.payload?.kind !== "card" || target?.kind !== "card" || target.listId !== listId) return null;
    return target.index;
  };

  const progressTags = (card: Card) =>
    card.checklists.map((checklist) => {
      const { percent } = checklistProgress(checklist);
      return (
        <span className={`kb-tag is-${progressTier(percent)}`} key={checklist.id}>
          <IconSquareCheck size={13} stroke={2} />
          {percent}%
        </span>
      );
    });

  const cardFace = (card: Card) => (
    <>
      <p className="kb-card-title">{card.title || <span className="kb-placeholder">Untitled card</span>}</p>
      {(card.description || card.checklists.length > 0) && (
        <div className="kb-card-meta">
          {card.description && (
            <span className="kb-card-note" aria-label="Has a description">
              <IconAlignLeft size={15} stroke={1.75} />
            </span>
          )}
          {progressTags(card)}
        </div>
      )}
    </>
  );

  const renderCard = (card: Card) => (
    <article
      className="kb-card"
      key={card.id}
      data-card-id={card.id}
      onPointerDown={(event) => beginDrag(event, { kind: "card", cardId: card.id, listId: card.listId })}
      onClick={() => setModal({ kind: "card", id: card.id })}
    >
      {cardFace(card)}
    </article>
  );

  const renderCards = (listId: string) => {
    const held = drag.payload?.kind === "card" ? drag.payload.cardId : null;
    const cards = cardsForList(state.cards, listId).filter((entry) => entry.id !== held);
    const slot = slotIndex(listId);
    const placeholder = <div className="kb-slot" key="slot" style={{ height: drag.size?.height }} />;
    const out: ReactNode[] = [];
    cards.forEach((card, index) => {
      if (slot === index) out.push(placeholder);
      out.push(renderCard(card));
    });
    if (slot === cards.length) out.push(placeholder);
    return out;
  };

  const listEntries = (listId: string, title: string, index: number, count: number): MenuEntry[] => [
    {
      label: "Add card",
      Icon: IconPlus,
      disabled: count >= MAX_CARDS_PER_LIST,
      onSelect: () => {
        setDraft("");
        setComposing(listId);
      },
    },
    {
      label: "Move left",
      Icon: IconArrowNarrowLeft,
      disabled: index === 0,
      onSelect: () =>
        setState((prev) => ({ ...prev, lists: shiftList(prev.lists, board?.id ?? "", listId, -1) })),
    },
    {
      label: "Move right",
      Icon: IconArrowNarrowRight,
      disabled: index === lists.length - 1,
      onSelect: () =>
        setState((prev) => ({ ...prev, lists: shiftList(prev.lists, board?.id ?? "", listId, 1) })),
    },
    {
      label: "Delete list",
      Icon: IconTrash,
      danger: true,
      onSelect: () => setModal({ kind: "delete-list", listId, title, count }),
    },
  ];

  const renderList = (list: { id: string; title: string }, index: number) => {
    const cards = cardsForList(state.cards, list.id);
    const atLimit = cards.length >= MAX_CARDS_PER_LIST;
    return (
      <section
        className="kb-list"
        key={list.id}
        data-list-id={list.id}
        onPointerDown={(event) => {
          // The whole header is the grab area -> plain click still activates the title rename input
          const target = event.target as Element;
          if (!target.closest("[data-list-head]") || target.closest(".kb-menu") || target.closest("input")) return;
          beginDrag(event, { kind: "list", listId: list.id });
        }}
      >
        <header className="kb-list-head" data-list-head="">
          <InlineTitle
            className="kb-list-title"
            label="List title"
            value={list.title}
            onCommit={(title) =>
              setState((prev) => ({
                ...prev,
                lists: prev.lists.map((entry) => (entry.id === list.id ? { ...entry, title } : entry)),
              }))
            }
          />
          <span className="kb-list-count">{cards.length}</span>
          <DotMenu
            id={`list-${list.id}`}
            openId={openMenu}
            onToggle={setOpenMenu}
            label={`${list.title} options`}
            entries={listEntries(list.id, list.title, index, cards.length)}
          />
        </header>

        <div className="kb-cards">{renderCards(list.id)}</div>

        {composing === list.id ? (
          <form
            className="kb-compose"
            onSubmit={(event: SyntheticEvent) => {
              event.preventDefault();
              if (draft.trim()) addCard(list.id, draft.trim());
            }}
          >
            <textarea
              className="kb-compose-input"
              value={draft}
              placeholder="What needs doing?"
              aria-label="New card title"
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (draft.trim()) addCard(list.id, draft.trim());
                }
                if (event.key === "Escape") setComposing(null);
              }}
            />
            <div className="kb-compose-actions">
              <button className="kb-btn kb-btn-strong" type="submit" disabled={!draft.trim()}>
                Add card
              </button>
              <button
                className="kb-icon-btn"
                type="button"
                aria-label="Cancel"
                onClick={() => setComposing(null)}
              >
                <IconX size={18} stroke={1.5} />
              </button>
            </div>
          </form>
        ) : (
          <button
            className="kb-list-add"
            disabled={atLimit}
            data-tooltip={atLimit ? `Limit of ${MAX_CARDS_PER_LIST} cards reached` : undefined}
            onClick={() => {
              setDraft("");
              setComposing(list.id);
            }}
          >
            <IconPlus size={17} stroke={1.75} />
            Add a card
          </button>
        )}
      </section>
    );
  };

  const renderBoardPage = () => {
    const held = drag.payload?.kind === "list" ? drag.payload.listId : null;
    const shown = lists.filter((entry) => entry.id !== held);
    const slot = held && drag.target?.kind === "list" ? drag.target.index : null;
    const placeholder = <div className="kb-list-slot" key="slot" style={{ height: drag.size?.height }} />;
    const columns: ReactNode[] = [];
    shown.forEach((list, index) => {
      if (slot === index) columns.push(placeholder);
      columns.push(renderList(list, lists.findIndex((entry) => entry.id === list.id)));
    });
    if (slot === shown.length) columns.push(placeholder);

    const atLimit = lists.length >= MAX_LISTS_PER_BOARD;
    return (
      <div className="kb-canvas">
        {columns}
        <div className="kb-list-new">
          {listDraft !== null ? (
            <form
              className="kb-compose"
              onSubmit={(event: SyntheticEvent) => {
                event.preventDefault();
                if (listDraft.trim()) addList(listDraft.trim());
              }}
            >
              <input
                className="kb-compose-input"
                value={listDraft}
                placeholder="List title"
                aria-label="New list title"
                autoFocus
                onChange={(event) => setListDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setListDraft(null);
                }}
              />
              <div className="kb-compose-actions">
                <button className="kb-btn kb-btn-strong" type="submit" disabled={!listDraft.trim()}>
                  Add list
                </button>
                <button
                  className="kb-icon-btn"
                  type="button"
                  aria-label="Cancel"
                  onClick={() => setListDraft(null)}
                >
                  <IconX size={18} stroke={1.5} />
                </button>
              </div>
            </form>
          ) : (
            <button
              className="kb-add-list"
              disabled={atLimit}
              data-tooltip={atLimit ? `Limit of ${MAX_LISTS_PER_BOARD} lists reached` : undefined}
              onClick={() => setListDraft("")}
            >
              <IconPlus size={18} stroke={1.75} />
              Add a list
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderBoardsPage = () => {
    const atLimit = state.boards.length >= MAX_BOARDS;
    return (
      <div className="kb-boards">
        <div className="kb-boards-grid">
          {state.boards.map((entry) => {
            const count = listsForBoard(state.lists, entry.id).length;
            return (
              <article className="kb-board-card" key={entry.id}>
                <button className="kb-board-open" onClick={() => setActiveBoardId(entry.id)}>
                  <span className="kb-board-title">{entry.title}</span>
                  {entry.description && <span className="kb-board-desc">{entry.description}</span>}
                  <span className="kb-board-count">
                    {count} {count === 1 ? "list" : "lists"}
                  </span>
                </button>
                <DotMenu
                  id={`board-${entry.id}`}
                  openId={openMenu}
                  onToggle={setOpenMenu}
                  label={`${entry.title} options`}
                  entries={[
                    {
                      label: "Edit board",
                      Icon: IconPencil,
                      onSelect: () => setModal({ kind: "board-form", board: entry }),
                    },
                    {
                      label: "Delete board",
                      Icon: IconTrash,
                      danger: true,
                      onSelect: () => setModal({ kind: "delete-board", board: entry }),
                    },
                  ]}
                />
              </article>
            );
          })}
          <button
            className="kb-board-new"
            disabled={atLimit}
            data-tooltip={atLimit ? `Limit of ${MAX_BOARDS} boards reached` : undefined}
            onClick={() => setModal({ kind: "board-form" })}
          >
            <IconPlus size={22} stroke={1.75} />
            New board
          </button>
        </div>
      </div>
    );
  };

  // The preview that follows the pointer
  const renderGhost = () => {
    const payload = drag.payload;
    const size = drag.size;
    if (!payload || !size) return null;
    let inner: ReactNode;
    if (payload.kind === "card") {
      const card = state.cards.find((entry) => entry.id === payload.cardId);
      inner = card ? <div className="kb-card">{cardFace(card)}</div> : null;
    } else {
      const list = lists.find((entry) => entry.id === payload.listId);
      const cards = list ? cardsForList(state.cards, list.id) : [];
      inner = list ? (
        <div className="kb-list">
          <header className="kb-list-head">
            <span className="kb-list-title">{list.title}</span>
            <span className="kb-list-count">{cards.length}</span>
          </header>
          <div className="kb-cards">
            {cards.map((card) => (
              <div className="kb-card" key={card.id}>
                {cardFace(card)}
              </div>
            ))}
          </div>
          <span className="kb-list-add">
            <IconPlus size={17} stroke={1.75} />
            Add a card
          </span>
        </div>
      ) : null;
    }
    return (
      <div
        ref={drag.ghostRef}
        className={`kb-ghost kb-ghost--${payload.kind}`}
        style={{ width: size.width, height: size.height }}
        aria-hidden="true"
      >
        {inner}
      </div>
    );
  };

  const modalCard = activeModal?.kind === "card" ? state.cards.find((c) => c.id === activeModal.id) : undefined;

  return (
    <div className={`kanban-board${drag.payload ? " is-dragging" : ""}`} ref={rootRef}>
      <header className="kb-topbar">
        <div className="kb-topbar-start">
          {board ? (
            <>
              <button className="kb-back" onClick={() => setActiveBoardId(null)}>
                <IconArrowLeft size={18} stroke={1.75} />
                All boards
              </button>
              <InlineTitle
                className="kb-board-heading"
                label="Board title"
                value={board.title}
                onCommit={(title) => patchBoard(board.id, { title })}
              />
            </>
          ) : (
            <h1 className="kb-board-heading kb-board-heading--static">
              <IconLayoutKanban size={24} stroke={1.5} />
              All boards
            </h1>
          )}
        </div>
        <div className="kb-profile">
          <span className="kb-profile-avatar">{user && <img src={user.avatarUrl} alt="" />}</span>
          <span className="kb-profile-name">{user?.name ?? "Your"}&rsquo;s kanban boards</span>
        </div>
      </header>

      <div className="kb-body">{board ? renderBoardPage() : renderBoardsPage()}</div>

      {renderGhost()}

      {activeModal?.kind === "card" && modalCard && (
        <CardModal
          card={modalCard}
          isClosing={isClosing}
          onClosed={onClosed}
          onChange={patchCard}
          onDelete={() => removeCard(modalCard.id)}
          onClose={() => setModal(null)}
        />
      )}
      {activeModal?.kind === "board-form" && (
        <BoardFormModal
          initial={activeModal.board}
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setModal(null)}
          onSubmit={(title, description) => saveBoard(title, description, activeModal.board)}
        />
      )}
      {activeModal?.kind === "delete-board" && (
        <ConfirmModal
          title="Delete board"
          confirmLabel="Delete board"
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setModal(null)}
          onConfirm={() => {
            setState((prev) => deleteBoard(prev, activeModal.board.id));
            if (activeBoardId === activeModal.board.id) setActiveBoardId(null);
            setModal(null);
          }}
        >
          Delete &ldquo;{activeModal.board.title}&rdquo;? Its lists and cards go with it, and this can&rsquo;t be
          undone.
        </ConfirmModal>
      )}
      {activeModal?.kind === "delete-list" && (
        <ConfirmModal
          title="Delete list"
          confirmLabel="Delete list"
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setModal(null)}
          onConfirm={() => {
            setState((prev) => deleteList(prev, activeModal.listId));
            setModal(null);
          }}
        >
          {activeModal.count > 0 ? (
            <>
              Delete &ldquo;{activeModal.title}&rdquo;? This also removes the {activeModal.count}{" "}
              {activeModal.count === 1 ? "card" : "cards"} on it, and can&rsquo;t be undone.
            </>
          ) : (
            <>Delete &ldquo;{activeModal.title}&rdquo;? This can&rsquo;t be undone.</>
          )}
        </ConfirmModal>
      )}
    </div>
  );
};

export default KanbanBoard;

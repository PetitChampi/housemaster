import { useState } from "react";
import {
  IconMoonStars,
  IconZzz,
  IconPlus,
  IconMinus,
  IconChevronLeft,
  IconExternalLink,
} from "@tabler/icons-react";
import { useCurrentUser } from "@/store/authStore";
import { canAccess } from "@/lib/roles";
import { blockedEmbedLabel } from "@/lib/embed";
import { useExitTransition } from "@/lib/useExitTransition";
import { ItemFormModal, ConfirmDeleteModal, NewSectionModal } from "@/pages/Bedroom/SnoozeBuddyModals";
import {
  initialSections,
  kindConfig,
  type SectionKind,
  type SnoozeItem,
  type SnoozeSection,
} from "@/pages/Bedroom/snoozeBuddyData";
import "@/styles/tools/SnoozeBuddy.css";

type ModalState =
  | { type: "add"; sectionId: string }
  | { type: "edit"; sectionId: string; item: SnoozeItem }
  | { type: "delete"; sectionId: string; item: SnoozeItem }
  | { type: "new-section" };

const SnoozeBuddy = () => {
  const user = useCurrentUser();
  const isAdmin = user ? canAccess(user.role, "ADMIN") : false;

  const [sections, setSections] = useState<SnoozeSection[]>(initialSections);
  const [controlsShown, setControlsShown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openItem, setOpenItem] = useState<{ item: SnoozeItem; kind: SectionKind } | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  // keep the active modal mounted during fade-out before it unmounts
  const {
    rendered: renderedModal,
    isClosing: modalClosing,
    onClosed: onModalClosed,
  } = useExitTransition(modal);

  const showControls = isAdmin && controlsShown;

  const updateItems = (sectionId: string, updater: (items: SnoozeItem[]) => SnoozeItem[]) =>
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, items: updater(section.items) } : section
      )
    );

  const addItem = (sectionId: string, data: Omit<SnoozeItem, "id">) =>
    updateItems(sectionId, (items) => [...items, { id: crypto.randomUUID(), ...data }]);

  const editItem = (sectionId: string, itemId: string, data: Omit<SnoozeItem, "id">) =>
    updateItems(sectionId, (items) =>
      items.map((item) => (item.id === itemId ? { ...item, ...data } : item))
    );

  const deleteItem = (sectionId: string, itemId: string) =>
    updateItems(sectionId, (items) => items.filter((item) => item.id !== itemId));

  const addSection = (data: { title: string; kind: SectionKind }) =>
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: data.kind, title: data.title, items: [] },
    ]);

  const toggleControls = () => {
    setControlsShown((shown) => !shown);
    setEditing(false);
  };

  const activeSection =
    renderedModal && "sectionId" in renderedModal
      ? sections.find((s) => s.id === renderedModal.sectionId) ?? null
      : null;

  if (openItem) {
    const cfg = kindConfig[openItem.kind];
    const DetailIcon = cfg.Icon;
    const { link, name } = openItem.item;
    const blockedLabel = link ? blockedEmbedLabel(link) : null;
    return (
      <div className="snooze-buddy sb-detail-view">
        <div className="sb-detail-head">
          <button className="sb-back" onClick={() => setOpenItem(null)}>
            <IconChevronLeft size={18} stroke={1.5} />
            All items
          </button>
          <div className="sb-detail-meta">
            <span className="sb-detail-title">
              <DetailIcon size={20} stroke={1.5} />
              {name}
            </span>
            {link && !blockedLabel && (
              <a
                className="sb-open-external"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in a new tab"
              >
                <IconExternalLink size={18} stroke={1.5} />
              </a>
            )}
          </div>
        </div>
        {!link ? (
          <div className="sb-detail-empty">No link set for this {cfg.noun} yet.</div>
        ) : blockedLabel ? (
          <div className="sb-detail-fallback">
            <DetailIcon size={48} stroke={1.25} />
            <p className="sb-fallback-name">{name}</p>
            <p className="sb-fallback-note">
              {blockedLabel} won&rsquo;t display inside the app, so it opens in a new tab.
            </p>
            <a className="sb-fallback-btn" href={link} target="_blank" rel="noopener noreferrer">
              <IconExternalLink size={18} stroke={1.5} />
              Open on {blockedLabel}
            </a>
          </div>
        ) : (
          <iframe className="iframe-content sb-detail-frame" src={link} title={name} />
        )}
      </div>
    );
  }

  return (
    <div className="snooze-buddy">
      <div className="sb-body">
        <header className="sb-title">
          <IconMoonStars size={36} stroke={1} className="sb-title-icon" />
          <h1>Snooze buddy</h1>
          <IconZzz size={36} stroke={1} className="sb-title-zzz" />
        </header>

        <div className="sb-sections">
          {sections.map((section) => {
            const cfg = kindConfig[section.kind];
            const SectionIcon = cfg.Icon;
            return (
              <section className="sb-section" key={section.id}>
                <div className="sb-section-head">
                  <p className="sb-section-title">
                    <SectionIcon size={20} stroke={1} />
                    {section.title}
                  </p>
                  <span className="sb-rule" />
                  {showControls && (
                    <button
                      className="sb-pill-btn"
                      onClick={() => setModal({ type: "add", sectionId: section.id })}
                    >
                      <IconPlus size={16} stroke={1.5} />
                      {cfg.addLabel}
                    </button>
                  )}
                </div>

                <div className="sb-items">
                  {section.items.map((item) => (
                    <div className="sb-item" key={item.id}>
                      <button
                        className="sb-item-pill"
                        onClick={() =>
                          editing
                            ? setModal({ type: "edit", sectionId: section.id, item })
                            : setOpenItem({ item, kind: section.kind })
                        }
                      >
                        <span className="sb-item-avatar">
                          {item.pictureUrl && <img src={item.pictureUrl} alt="" />}
                        </span>
                        <span className="sb-item-name">{item.name}</span>
                      </button>
                      {editing && (
                        <button
                          className="sb-item-remove"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => setModal({ type: "delete", sectionId: section.id, item })}
                        >
                          <IconMinus size={14} stroke={2.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {showControls && (
          <div className="sb-controls">
            <button className="sb-btn" onClick={() => setEditing((value) => !value)}>
              {editing ? "Finish editing" : "Edit items"}
            </button>
            <button
              className="sb-btn sb-btn-strong"
              onClick={() => setModal({ type: "new-section" })}
            >
              <IconPlus size={18} stroke={1.5} />
              New section
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="sb-footer">
          <button className="sb-toggle" onClick={toggleControls}>
            {controlsShown ? "Hide controls" : "Show controls"}
          </button>
        </div>
      )}

      {renderedModal?.type === "add" && activeSection && (
        <ItemFormModal
          mode="add"
          kind={activeSection.kind}
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            addItem(activeSection.id, data);
            setModal(null);
          }}
        />
      )}
      {renderedModal?.type === "edit" && activeSection && (
        <ItemFormModal
          mode="edit"
          kind={activeSection.kind}
          initial={renderedModal.item}
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            editItem(activeSection.id, renderedModal.item.id, data);
            setModal(null);
          }}
        />
      )}
      {renderedModal?.type === "delete" && activeSection && (
        <ConfirmDeleteModal
          kind={activeSection.kind}
          itemName={renderedModal.item.name}
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onConfirm={() => {
            deleteItem(activeSection.id, renderedModal.item.id);
            setModal(null);
          }}
        />
      )}
      {renderedModal?.type === "new-section" && (
        <NewSectionModal
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            addSection(data);
            setModal(null);
          }}
        />
      )}
    </div>
  );
};

export default SnoozeBuddy;

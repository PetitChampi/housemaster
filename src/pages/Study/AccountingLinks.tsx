import { useState } from "react";
import { IconCalculator, IconPlus, IconMinus } from "@tabler/icons-react";
import { useCurrentUser } from "@/store/authStore";
import { canAccess } from "@/lib/roles";
import { faviconUrl } from "@/lib/favicon";
import { useExitTransition } from "@/lib/useExitTransition";
import { LinkFormModal, ConfirmDeleteLinkModal } from "@/pages/Study/AccountingLinksModals";
import { initialLinks, iconByKey, type AccountingLink } from "@/pages/Study/accountingLinksData";
import "@/styles/tools/AccountingLinks.css";

type ModalState =
  | { type: "add" }
  | { type: "edit"; link: AccountingLink }
  | { type: "delete"; link: AccountingLink };

const AccountingLinks = () => {
  const user = useCurrentUser();
  const isAdmin = user ? canAccess(user.role, "ADMIN") : false;

  const [links, setLinks] = useState<AccountingLink[]>(initialLinks);
  const [controlsShown, setControlsShown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);

  const {
    rendered: renderedModal,
    isClosing: modalClosing,
    onClosed: onModalClosed,
  } = useExitTransition(modal);

  const showControls = isAdmin && controlsShown;

  const addLink = (data: Omit<AccountingLink, "id">) =>
    setLinks((prev) => [...prev, { id: crypto.randomUUID(), ...data }]);

  const editLink = (id: string, data: Omit<AccountingLink, "id">) =>
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...data } : link)));

  const deleteLink = (id: string) => setLinks((prev) => prev.filter((link) => link.id !== id));

  const toggleControls = () => {
    setControlsShown((shown) => !shown);
    setEditing(false);
  };

  return (
    <div className="accounting-links">
      <div className="al-body">
        <header className="al-title">
          <IconCalculator size={36} stroke={1} className="al-title-icon" />
          <h1>Accounting quick links</h1>
        </header>
        <div className="al-links">
          {links.map((link) => {
            const LinkIcon = link.icon ? iconByKey[link.icon] : null;
            const favicon = faviconUrl(link.url);
            return (
              <div className="al-link" key={link.id}>
                <a
                  className="al-link-pill"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={
                    editing
                      ? (event) => {
                          event.preventDefault();
                          setModal({ type: "edit", link });
                        }
                      : undefined
                  }
                >
                  <span className="al-link-avatar">{favicon && <img src={favicon} alt="" />}</span>
                  {LinkIcon && <LinkIcon size={22} stroke={1} className="al-link-icon" />}
                  <span className="al-link-name">{link.name}</span>
                </a>
                {editing && (
                  <button
                    className="al-link-remove"
                    aria-label={`Delete ${link.name}`}
                    onClick={() => setModal({ type: "delete", link })}
                  >
                    <IconMinus size={14} stroke={2.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {showControls && (
          <div className="al-controls">
            <button className="al-btn" onClick={() => setEditing((value) => !value)}>
              {editing ? "Finish editing" : "Edit links"}
            </button>
            <button className="al-btn al-btn-strong" onClick={() => setModal({ type: "add" })}>
              <IconPlus size={18} stroke={1.5} />
              New link
            </button>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="al-footer">
          <button className="al-toggle" onClick={toggleControls}>
            {controlsShown ? "Hide controls" : "Show controls"}
          </button>
        </div>
      )}
      {renderedModal?.type === "add" && (
        <LinkFormModal
          mode="add"
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            addLink(data);
            setModal(null);
          }}
        />
      )}
      {renderedModal?.type === "edit" && (
        <LinkFormModal
          mode="edit"
          initial={renderedModal.link}
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            editLink(renderedModal.link.id, data);
            setModal(null);
          }}
        />
      )}
      {renderedModal?.type === "delete" && (
        <ConfirmDeleteLinkModal
          linkName={renderedModal.link.name}
          isClosing={modalClosing}
          onClosed={onModalClosed}
          onClose={() => setModal(null)}
          onConfirm={() => {
            deleteLink(renderedModal.link.id);
            setModal(null);
          }}
        />
      )}
    </div>
  );
};

export default AccountingLinks;

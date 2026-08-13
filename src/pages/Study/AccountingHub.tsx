import { useState } from "react";
import { IconCalculator, IconPlus, IconMinus } from "@tabler/icons-react";
import { useCurrentUser } from "@/store/authStore";
import { canAccess } from "@/lib/roles";
import { useExitTransition } from "@/lib/useExitTransition";
import { LinkFormModal, ConfirmDeleteLinkModal } from "@/pages/Study/AccountingHubModals";
import { initialLinks, iconByKey, type AccountingLink } from "@/pages/Study/accountingHubData";
import boredBelinda from "@/assets/bored-belinda.svg";
import "@/styles/tools/AccountingHub.css";

type ModalState =
  | { type: "add" }
  | { type: "edit"; link: AccountingLink }
  | { type: "delete"; link: AccountingLink };

const AccountingHub = () => {
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
    <div className="accounting-hub">
      <div className="ah-body">
        <header className="ah-title">
          <IconCalculator size={36} stroke={1.5} className="ah-title-icon" aria-hidden />
          <h1>Accounting hub</h1>
          <IconCalculator size={36} stroke={1.5} className="ah-title-icon" aria-hidden />
        </header>
        <p className="ah-subtitle">Yay, admin time! We all love a good bookkeeping session.</p>
        <img className="ah-illustration" src={boredBelinda} alt="" />
        <div className="ah-links">
          {links.map((link) => {
            const LinkIcon = iconByKey[link.icon];
            return (
              <div className="ah-link" key={link.id}>
                <a
                  className="ah-link-pill"
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
                  <span className="ah-link-medallion">
                    {LinkIcon && <LinkIcon size={22} stroke={1} />}
                  </span>
                  <span className="ah-link-name">{link.name}</span>
                </a>
                {editing && (
                  <button
                    className="ah-link-remove"
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
          <div className="ah-controls">
            <button className="ah-btn" onClick={() => setEditing((value) => !value)}>
              {editing ? "Finish editing" : "Edit links"}
            </button>
            <button className="ah-btn ah-btn-strong" onClick={() => setModal({ type: "add" })}>
              <IconPlus size={18} stroke={1.5} />
              New link
            </button>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="ah-footer">
          <button className="ah-toggle" onClick={toggleControls}>
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

export default AccountingHub;

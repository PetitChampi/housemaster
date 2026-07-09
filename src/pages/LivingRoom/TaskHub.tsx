import { useEffect, useState, type SyntheticEvent } from "react";
import {
  IconGripVertical,
  IconTrash,
  IconArrowUpRight,
  IconCheck,
  IconPlus,
} from "@tabler/icons-react";
import { useExitTransition } from "@/lib/useExitTransition";
import { ConfirmModal } from "@/pages/LivingRoom/TaskHubModals";
import {
  moveTodoToFocus,
  promoteToTodo,
  reorderList,
  reorderTodo,
} from "@/pages/LivingRoom/taskHubLogic";
import {
  loadLists,
  makeInitialData,
  saveLists,
  type Lists,
  type ListKey,
  type Task,
  type TodoFocus,
} from "@/pages/LivingRoom/taskHubData";
import "@/styles/tools/TaskHub.css";

type TabId = "todo" | "backlog" | "guideline";

type Confirm =
  | { type: "delete"; key: ListKey; task: Task }
  | { type: "reset"; key: ListKey; label: string; count: number };

const tabs: { id: TabId; label: string }[] = [
  { id: "todo", label: "To-do" },
  { id: "backlog", label: "Backlog" },
  { id: "guideline", label: "Daily guideline" },
];

const resetLabels: Record<ListKey, string> = {
  todo: "your To-do list",
  backlog: "your backlog",
  chores: "your chore checklist",
  structure: "your daily structure",
};

const TaskHub = () => {
  const [activeTab, setActiveTab] = useState<TabId>("todo");
  const [lists, setLists] = useState<Lists>(loadLists);
  const [controlsShown, setControlsShown] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<TodoFocus | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  // Keep the confirm modal mounted during fade-out before unmounting
  const { rendered: confirmModal, isClosing, onClosed } = useExitTransition(confirm);

  // localStorage to save lists
  useEffect(() => saveLists(lists), [lists]);

  function updateList<K extends ListKey>(key: K, updater: (items: Lists[K]) => Lists[K]) {
    setLists((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  }

  const patchTask = <K extends ListKey>(key: K, id: string, patch: Partial<Task>) =>
    updateList(key, (items) => {
      return items.map((item) => (item.id === id ? { ...item, ...patch } : item)) as Lists[K]
    });

  const toggleDone = <K extends ListKey>(key: K, id: string) =>
    updateList(key, (items) => {
      return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)) as Lists[K]
    });

  const removeTask = <K extends ListKey>(key: K, id: string) =>
    updateList(key, (items) => items.filter((item) => item.id !== id) as Lists[K]);

  const addTask = (key: "backlog" | "chores" | "structure") => {
    const id = crypto.randomUUID();
    updateList(key, (items) => [...items, { id, text: "", done: false }]);
    setEditingId(id);
  };

  const addTodo = (focus: TodoFocus) => {
    const id = crypto.randomUUID();
    updateList("todo", (items) => [...items, { id, text: "", done: false, focus }]);
    setEditingId(id);
  };

  const moveToTodo = (id: string) => setLists((prev) => promoteToTodo(prev, id));

  const resetList = <K extends ListKey>(key: K) => updateList(key, () => makeInitialData()[key]);

  const dropOnItem = (key: "backlog" | "chores" | "structure", fromId: string, toId: string) =>
    updateList(key, (items) => reorderList(items, fromId, toId));

  const dropOnTodoItem = (fromId: string, toId: string) =>
    updateList("todo", (items) => reorderTodo(items, fromId, toId));

  const dropOnTodoZone = (fromId: string, focus: TodoFocus) =>
    updateList("todo", (items) => moveTodoToFocus(items, fromId, focus));

  const commitText = (key: ListKey, id: string, raw: string) => {
    const text = raw.trim();
    if (text) patchTask(key, id, { text });
    else removeTask(key, id);
    setEditingId(null);
  };

  const askDelete = (key: ListKey, task: Task) => setConfirm({ type: "delete", key, task });

  const askReset = (key: ListKey) =>
    setConfirm({ type: "reset", key, label: resetLabels[key], count: lists[key].length });

  const renderItem = (
    key: ListKey,
    task: Task,
    opts: { tick: boolean; move?: boolean } = { tick: true }
  ) => {
    const editing = editingId === task.id;
    const classes = [
      "th-item",
      task.done && "is-done",
      !opts.tick && "th-item--plain",
      dragId === task.id && "is-dragging",
      dropId === task.id && dragId && dragId !== task.id && "is-drop-target",
    ].filter(Boolean).join(" ");
    return (
      <div
        className={classes}
        key={task.id}
        draggable={!editing}
        onDragStart={() => setDragId(task.id)}
        onDragEnd={() => {
          setDragId(null);
          setDropId(null);
        }}
        onDragOver={(event) => {
          if (dragId && dragId !== task.id) {
            event.preventDefault();
            event.stopPropagation();
            setDropId(task.id);
            setDropZone(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (dragId) {
            if (key === "todo") dropOnTodoItem(dragId, task.id);
            else dropOnItem(key, dragId, task.id);
          }
          setDragId(null);
          setDropId(null);
          setDropZone(null);
        }}
      >
        <span className="th-grip" aria-hidden="true">
          <IconGripVertical size={18} stroke={1.5} />
        </span>
        {editing ? (
          <input
            id={`task-${task.id}`}
            className="th-item-input"
            defaultValue={task.text}
            autoFocus
            onFocus={(event: SyntheticEvent<HTMLInputElement>) => event.currentTarget.select()}
            onBlur={(event: SyntheticEvent<HTMLInputElement>) =>
              commitText(key, task.id, event.currentTarget.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
            }}
          />
        ) : (
          <button className="th-item-text" onClick={() => setEditingId(task.id)}>
            {task.text || <span className="th-item-placeholder">New task&hellip;</span>}
          </button>
        )}
        {controlsShown && opts.move && (
          <button
            className="th-item-move"
            aria-label="Move to To-do"
            data-tooltip="Move to To-do"
            data-tooltip-dir="top"
            onClick={() => moveToTodo(task.id)}
          >
            <IconArrowUpRight size={18} stroke={1.75} />
          </button>
        )}
        {controlsShown && (
          <button
            className="th-item-delete"
            aria-label="Delete task"
            data-tooltip="Delete task"
            data-tooltip-dir="top"
            onClick={() => askDelete(key, task)}
          >
            <IconTrash size={18} stroke={1.5} />
          </button>
        )}
        {opts.tick && (
          <button
            className="th-tick"
            aria-pressed={task.done}
            aria-label={task.done ? "Mark not done" : "Mark done"}
            onClick={() => toggleDone(key, task.id)}
          >
            {task.done && <IconCheck size={14} stroke={3} />}
          </button>
        )}
      </div>
    );
  };

  const renderList = (
    tasks: Task[],
    key: ListKey,
    opts: { tick: boolean; move?: boolean },
    emptyLabel: string
  ) =>
    tasks.length ? (
      tasks.map((task) => renderItem(key, task, opts))
    ) : (
      <p className="th-empty">{emptyLabel}</p>
    );

  const todoZone = (focus: TodoFocus) => ({
    className: `th-items${dragId && dropZone === focus ? " is-drop-zone" : ""}`,
    onDragOver: (event: SyntheticEvent) => {
      if (dragId) {
        event.preventDefault();
        setDropZone(focus);
      }
    },
    onDrop: (event: SyntheticEvent) => {
      event.preventDefault();
      if (dragId) dropOnTodoZone(dragId, focus);
      setDragId(null);
      setDropId(null);
      setDropZone(null);
    },
  });

  const sectionHead = (title: string) => (
    <div className="th-section-head">
      <p className="th-section-title">{title}</p>
      <span className="th-rule" />
    </div>
  );

  const actions = (resetLabel: string, onReset: () => void, addLabel: string, onAdd: () => void) =>
    controlsShown && (
      <div className="th-actions">
        <button className="th-btn th-btn-ghost" onClick={onReset}>
          {resetLabel}
        </button>
        <button className="th-btn th-btn-strong" onClick={onAdd}>
          <IconPlus size={18} stroke={1.5} />
          {addLabel}
        </button>
      </div>
    );

  const renderPanel = () => {
    if (activeTab === "todo") {
      return (
        <>
          <section className="th-section">
            {sectionHead("Primary focus")}
            <div {...todoZone("primary")}>
              {renderList(
                lists.todo.filter((task) => task.focus === "primary"),
                "todo",
                { tick: true },
                "No critical tasks right now."
              )}
            </div>
          </section>
          <section className="th-section">
            {sectionHead("Secondary focus")}
            <div {...todoZone("secondary")}>
              {renderList(
                lists.todo.filter((task) => task.focus === "secondary"),
                "todo",
                { tick: true },
                "Nothing on the back burner."
              )}
            </div>
            {actions("Reset list", () => askReset("todo"), "New task", () => addTodo("primary"))}
          </section>
        </>
      );
    }

    if (activeTab === "backlog") {
      return (
        <section className="th-section">
          <div className="th-items">
            {renderList(
              lists.backlog,
              "backlog",
              { tick: true, move: true },
              "Your backlog is empty."
            )}
          </div>
          {actions("Reset backlog", () => askReset("backlog"), "New task", () => addTask("backlog"))}
        </section>
      );
    }

    return (
      <>
        <section className="th-section">
          {sectionHead("Chore checklist")}
          <div className="th-items">
            {renderList(lists.chores, "chores", { tick: true }, "No chores added yet.")}
          </div>
          {actions("Reset list", () => askReset("chores"), "New chore", () => addTask("chores"))}
        </section>
        <section className="th-section">
          {sectionHead("Daily structure")}
          <div className="th-items contains-plain">
            {renderList(lists.structure, "structure", { tick: false }, "No structure set yet.")}
          </div>
          {actions("Reset list", () => askReset("structure"), "New step", () => addTask("structure"))}
        </section>
      </>
    );
  };

  return (
    <div className="task-hub">
      <div className="th-body">
        <div className="th-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`th-tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="th-panel">{renderPanel()}</div>
      </div>

      <div className="th-footer">
        <button className="th-toggle" onClick={() => setControlsShown((shown) => !shown)}>
          {controlsShown ? "Hide controls" : "Show controls"}
        </button>
      </div>

      {confirmModal?.type === "delete" && (
        <ConfirmModal
          title="Delete task"
          confirmLabel="Delete"
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            removeTask(confirmModal.key, confirmModal.task.id);
            setConfirm(null);
          }}
        >
          Delete &ldquo;{confirmModal.task.text || "this task"}&rdquo;? This can&rsquo;t be undone.
        </ConfirmModal>
      )}
      {confirmModal?.type === "reset" && (
        <ConfirmModal
          title="Reset list"
          confirmLabel="Reset"
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            resetList(confirmModal.key);
            setConfirm(null);
          }}
        >
          {confirmModal.count > 0 ? (
            <>
              Reset {confirmModal.label}? This permanently removes all {confirmModal.count}{" "}
              {confirmModal.count === 1 ? "item" : "items"}. This can&rsquo;t be undone.
            </>
          ) : (
            <>{confirmModal.label} is already empty.</>
          )}
        </ConfirmModal>
      )}
    </div>
  );
};

export default TaskHub;

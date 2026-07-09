import type { Lists, Task, TodoFocus, TodoTask } from "@/pages/LivingRoom/taskHubData";

// Pure list transforms for drag-drop and move actions
// Kept out of the component so they can be unit tested without a DOM

export function reorderList<T extends Task>(items: T[], fromId: string, toId: string): T[] {
  const from = items.findIndex((item) => item.id === fromId);
  const to = items.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function reorderTodo(todo: TodoTask[], fromId: string, toId: string): TodoTask[] {
  const from = todo.findIndex((item) => item.id === fromId);
  const to = todo.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0 || from === to) return todo;
  const focus = todo[to].focus;
  const next = todo.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, { ...moved, focus });
  return next;
}

// Move item to the end of a focus group
export function moveTodoToFocus(todo: TodoTask[], fromId: string, focus: TodoFocus): TodoTask[] {
  const item = todo.find((task) => task.id === fromId);
  if (!item || item.focus === focus) return todo;
  return [...todo.filter((task) => task.id !== fromId), { ...item, focus }];
}

// Promote backlog item to today's list (lands on Secondary focus)
export function promoteToTodo(lists: Lists, id: string): Lists {
  const item = lists.backlog.find((task) => task.id === id);
  if (!item) return lists;
  return {
    ...lists,
    backlog: lists.backlog.filter((task) => task.id !== id),
    todo: [...lists.todo, { id: item.id, text: item.text, done: false, focus: "secondary" }],
  };
}

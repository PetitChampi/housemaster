import type { Card, Checklist, KanbanState, List } from "@/pages/Study/kanbanData";

// Pure transforms for ordering, moving and progress
// Kept out of the components so they can be unit tested without a DOM

export const listsForBoard = (lists: List[], boardId: string): List[] =>
  lists.filter((list) => list.boardId === boardId);

export const cardsForList = (cards: Card[], listId: string): Card[] =>
  cards.filter((card) => card.listId === listId);

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

// checklist with no items = 0%, keeps a freshly added one from claiming to be complete
export function checklistProgress(checklist: Checklist): Progress {
  const total = checklist.items.length;
  const done = checklist.items.filter((entry) => entry.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export type ProgressTier = "low" | "fair" | "half" | "high" | "done";

export function progressTier(percent: number): ProgressTier {
  if (percent >= 100) return "done";
  if (percent >= 75) return "high";
  if (percent >= 50) return "half";
  if (percent >= 25) return "fair";
  return "low";
}

// Moves a card to toIndex within toListId, where the index counts the target list without the card being moved
// The flat array is spliced so the card shows just before whichever card should follow
export function moveCard(cards: Card[], cardId: string, toListId: string, toIndex: number): Card[] {
  const card = cards.find((entry) => entry.id === cardId);
  if (!card) return cards;
  const rest = cards.filter((entry) => entry.id !== cardId);
  const moved = { ...card, listId: toListId };
  const targetIds = rest.filter((entry) => entry.listId === toListId).map((entry) => entry.id);
  const index = Math.max(0, Math.min(toIndex, targetIds.length));
  if (index === targetIds.length) {
    const lastId = targetIds[targetIds.length - 1];
    const at = lastId ? rest.findIndex((entry) => entry.id === lastId) + 1 : rest.length;
    return [...rest.slice(0, at), moved, ...rest.slice(at)];
  }
  const at = rest.findIndex((entry) => entry.id === targetIds[index]);
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}

// Same indexing rule as moveCard, applied to a board's columns
export function moveList(lists: List[], boardId: string, listId: string, toIndex: number): List[] {
  const list = lists.find((entry) => entry.id === listId);
  if (!list || list.boardId !== boardId) return lists;
  const rest = lists.filter((entry) => entry.id !== listId);
  const targetIds = rest.filter((entry) => entry.boardId === boardId).map((entry) => entry.id);
  const index = Math.max(0, Math.min(toIndex, targetIds.length));
  if (index === targetIds.length) {
    const lastId = targetIds[targetIds.length - 1];
    const at = lastId ? rest.findIndex((entry) => entry.id === lastId) + 1 : rest.length;
    return [...rest.slice(0, at), list, ...rest.slice(at)];
  }
  const at = rest.findIndex((entry) => entry.id === targetIds[index]);
  return [...rest.slice(0, at), list, ...rest.slice(at)];
}

// One step left or right, for the list menu -> Gives keyboard and touch users a way to reorder without dragging
export function shiftList(lists: List[], boardId: string, listId: string, direction: -1 | 1): List[] {
  const order = listsForBoard(lists, boardId).map((entry) => entry.id);
  const at = order.indexOf(listId);
  const to = at + direction;
  if (at < 0 || to < 0 || to >= order.length) return lists;
  return moveList(lists, boardId, listId, to);
}

// Deleting cascades, since an orphaned list or card would linger in storage with nothing able to reach it
export function deleteBoard(state: KanbanState, boardId: string): KanbanState {
  const listIds = new Set(listsForBoard(state.lists, boardId).map((list) => list.id));
  return {
    boards: state.boards.filter((board) => board.id !== boardId),
    lists: state.lists.filter((list) => list.boardId !== boardId),
    cards: state.cards.filter((card) => !listIds.has(card.listId)),
  };
}

export function deleteList(state: KanbanState, listId: string): KanbanState {
  return {
    ...state,
    lists: state.lists.filter((list) => list.id !== listId),
    cards: state.cards.filter((card) => card.listId !== listId),
  };
}

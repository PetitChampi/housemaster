import { describe, it, expect } from "vitest";
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
import type { Card, Checklist, KanbanState, List } from "@/pages/Study/kanbanData";

const card = (id: string, listId: string): Card => ({
  id,
  listId,
  title: id,
  description: "",
  checklists: [],
});

const list = (id: string, boardId: string): List => ({ id, boardId, title: id });

const checklist = (...done: boolean[]): Checklist => ({
  id: "cl",
  title: "cl",
  items: done.map((value, index) => ({ id: `i${index}`, text: `i${index}`, done: value })),
});

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe("checklistProgress", () => {
  it("counts ticked items and rounds the percentage", () => {
    expect(checklistProgress(checklist(true, false, false))).toEqual({ done: 1, total: 3, percent: 33 });
    expect(checklistProgress(checklist(true, true, false))).toEqual({ done: 2, total: 3, percent: 67 });
  });

  it("treats an empty checklist as 0% rather than complete", () => {
    expect(checklistProgress(checklist())).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("reports 100% when every item is ticked", () => {
    expect(checklistProgress(checklist(true, true))).toEqual({ done: 2, total: 2, percent: 100 });
  });
});

describe("progressTier", () => {
  it("bands the spectrum at the quarter marks", () => {
    expect(progressTier(0)).toBe("low");
    expect(progressTier(24)).toBe("low");
    expect(progressTier(25)).toBe("fair");
    expect(progressTier(49)).toBe("fair");
    expect(progressTier(50)).toBe("half");
    expect(progressTier(74)).toBe("half");
    expect(progressTier(75)).toBe("high");
    expect(progressTier(99)).toBe("high");
  });

  it("gives 100% its own tier", () => {
    expect(progressTier(100)).toBe("done");
  });
});

describe("moveCard", () => {
  const cards = [card("a", "l1"), card("b", "l1"), card("c", "l2")];

  it("reorders within a list", () => {
    expect(ids(cardsForList(moveCard(cards, "a", "l1", 1), "l1"))).toEqual(["b", "a"]);
    expect(ids(cardsForList(moveCard(cards, "b", "l1", 0), "l1"))).toEqual(["b", "a"]);
  });

  it("moves a card across lists and rewrites its listId", () => {
    const next = moveCard(cards, "a", "l2", 0);
    expect(ids(cardsForList(next, "l2"))).toEqual(["a", "c"]);
    expect(ids(cardsForList(next, "l1"))).toEqual(["b"]);
    expect(next.find((entry) => entry.id === "a")?.listId).toBe("l2");
  });

  it("appends when the index is past the end of the target list", () => {
    expect(ids(cardsForList(moveCard(cards, "a", "l2", 9), "l2"))).toEqual(["c", "a"]);
  });

  it("moves into an empty list", () => {
    expect(ids(cardsForList(moveCard(cards, "a", "l3", 0), "l3"))).toEqual(["a"]);
  });

  it("leaves the array alone for an unknown card", () => {
    expect(moveCard(cards, "nope", "l1", 0)).toBe(cards);
  });

  it("keeps other lists in order when boards interleave in the flat array", () => {
    const mixed = [card("a", "l1"), card("c", "l2"), card("b", "l1")];
    const next = moveCard(mixed, "a", "l1", 1);
    expect(ids(cardsForList(next, "l1"))).toEqual(["b", "a"]);
    expect(ids(cardsForList(next, "l2"))).toEqual(["c"]);
  });
});

describe("moveList", () => {
  const lists = [list("x", "b1"), list("y", "b1"), list("z", "b2")];

  it("reorders columns within a board", () => {
    expect(ids(listsForBoard(moveList(lists, "b1", "x", 1), "b1"))).toEqual(["y", "x"]);
  });

  it("ignores a list that belongs to another board", () => {
    expect(moveList(lists, "b1", "z", 0)).toBe(lists);
  });

  it("leaves the other board's columns untouched", () => {
    expect(ids(listsForBoard(moveList(lists, "b1", "x", 1), "b2"))).toEqual(["z"]);
  });
});

describe("shiftList", () => {
  const lists = [list("x", "b1"), list("y", "b1"), list("z", "b1")];

  it("steps a column one place right", () => {
    expect(ids(listsForBoard(shiftList(lists, "b1", "y", 1), "b1"))).toEqual(["x", "z", "y"]);
  });

  it("steps a column one place left", () => {
    expect(ids(listsForBoard(shiftList(lists, "b1", "y", -1), "b1"))).toEqual(["y", "x", "z"]);
  });

  it("stops at either end", () => {
    expect(shiftList(lists, "b1", "x", -1)).toBe(lists);
    expect(shiftList(lists, "b1", "z", 1)).toBe(lists);
  });
});

describe("deleteBoard", () => {
  const state: KanbanState = {
    boards: [
      { id: "b1", title: "b1", description: "" },
      { id: "b2", title: "b2", description: "" },
    ],
    lists: [list("l1", "b1"), list("l2", "b2")],
    cards: [card("c1", "l1"), card("c2", "l2")],
  };

  it("takes the board's lists and cards with it", () => {
    const next = deleteBoard(state, "b1");
    expect(ids(next.boards)).toEqual(["b2"]);
    expect(ids(next.lists)).toEqual(["l2"]);
    expect(ids(next.cards)).toEqual(["c2"]);
  });
});

describe("deleteList", () => {
  const state: KanbanState = {
    boards: [{ id: "b1", title: "b1", description: "" }],
    lists: [list("l1", "b1"), list("l2", "b1")],
    cards: [card("c1", "l1"), card("c2", "l2")],
  };

  it("takes the list's cards with it", () => {
    const next = deleteList(state, "l1");
    expect(ids(next.lists)).toEqual(["l2"]);
    expect(ids(next.cards)).toEqual(["c2"]);
  });
});

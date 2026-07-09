import { describe, it, expect } from "vitest";
import {
  moveTodoToFocus,
  promoteToTodo,
  reorderList,
  reorderTodo,
} from "@/pages/LivingRoom/taskHubLogic";
import type { Lists, Task, TodoTask } from "@/pages/LivingRoom/taskHubData";

const task = (id: string): Task => ({ id, text: id, done: false });
const todo = (id: string, focus: TodoTask["focus"]): TodoTask => ({ id, text: id, done: false, focus });
const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe("reorderList", () => {
  it("moves the first item onto the second (drag down)", () => {
    expect(ids(reorderList([task("a"), task("b")], "a", "b"))).toEqual(["b", "a"]);
  });

  it("moves the second item onto the first (drag up)", () => {
    expect(ids(reorderList([task("a"), task("b")], "b", "a"))).toEqual(["b", "a"]);
  });

  it("drops onto a target further down the list", () => {
    expect(ids(reorderList([task("a"), task("b"), task("c")], "a", "c"))).toEqual(["b", "c", "a"]);
  });

  it("drops onto a target further up the list", () => {
    expect(ids(reorderList([task("a"), task("b"), task("c")], "c", "a"))).toEqual(["c", "a", "b"]);
  });

  it("returns the same array reference when the ids match or are missing", () => {
    const items = [task("a"), task("b")];
    expect(reorderList(items, "a", "a")).toBe(items);
    expect(reorderList(items, "ghost", "a")).toBe(items);
  });
});

describe("reorderTodo", () => {
  it("moves the first item onto the second within one focus group (drag down)", () => {
    // Regression: dragging the first item onto the second used to fail
    const result = reorderTodo([todo("a", "primary"), todo("b", "primary")], "a", "b");
    expect(ids(result)).toEqual(["b", "a"]);
  });

  it("moves the second item onto the first within one focus group (drag up)", () => {
    const result = reorderTodo([todo("a", "primary"), todo("b", "primary")], "b", "a");
    expect(ids(result)).toEqual(["b", "a"]);
  });

  it("adopts the target's focus when dropped across the divide", () => {
    const result = reorderTodo([todo("a", "primary"), todo("b", "secondary")], "a", "b");
    expect(result.find((t) => t.id === "a")?.focus).toBe("secondary");
  });

  it("is a no-op for matching or missing ids", () => {
    const items = [todo("a", "primary"), todo("b", "primary")];
    expect(reorderTodo(items, "a", "a")).toBe(items);
    expect(reorderTodo(items, "ghost", "a")).toBe(items);
  });
});

describe("moveTodoToFocus", () => {
  it("moves an item to the end of the other focus group", () => {
    const result = moveTodoToFocus([todo("a", "primary"), todo("b", "secondary")], "a", "secondary");
    expect(ids(result)).toEqual(["b", "a"]);
    expect(result.find((t) => t.id === "a")?.focus).toBe("secondary");
  });

  it("is a no-op when the item already has that focus or is missing", () => {
    const items = [todo("a", "primary")];
    expect(moveTodoToFocus(items, "a", "primary")).toBe(items);
    expect(moveTodoToFocus(items, "ghost", "secondary")).toBe(items);
  });
});

describe("promoteToTodo", () => {
  const base = (): Lists => ({
    todo: [],
    backlog: [task("x"), task("y")],
    chores: [],
    structure: [],
  });

  it("moves a backlog item to the todo list on Secondary focus", () => {
    const result = promoteToTodo(base(), "x");
    expect(ids(result.backlog)).toEqual(["y"]);
    expect(result.todo).toEqual([{ id: "x", text: "x", done: false, focus: "secondary" }]);
  });

  it("returns the same lists when the id is missing", () => {
    const lists = base();
    expect(promoteToTodo(lists, "ghost")).toBe(lists);
  });
});

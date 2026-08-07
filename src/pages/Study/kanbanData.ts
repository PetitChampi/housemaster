// Types + caps + seed + localStorage persistence for the Kanban board tool

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  checklists: Checklist[];
}

export interface List {
  id: string;
  boardId: string;
  title: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
}

// Boards, lists and cards are held flat with foreign keys rather than nested, so moving a card between lists is one splice
// Position is array order, the same way the Task hub orders its lists
export interface KanbanState {
  boards: Board[];
  lists: List[];
  cards: Card[];
}

export const MAX_BOARDS = 20;
export const MAX_LISTS_PER_BOARD = 12;
export const MAX_CARDS_PER_LIST = 50;
export const MAX_CHECKLISTS_PER_CARD = 10;
export const MAX_ITEMS_PER_CHECKLIST = 50;

const item = (id: string, text: string, done: boolean): ChecklistItem => ({ id, text, done });

export const makeInitialData = (): KanbanState => {
  const board = "kb-board-house";
  const todo = "kb-list-todo";
  const doing = "kb-list-doing";
  const done = "kb-list-done";
  return {
    boards: [
      {
        id: board,
        title: "Household projects",
        description: "Everything the house needs doing, roughly in the order we mean to get to it.",
      },
    ],
    lists: [
      { id: todo, boardId: board, title: "To do" },
      { id: doing, boardId: board, title: "In progress" },
      { id: done, boardId: board, title: "Done" },
    ],
    cards: [
      {
        id: "kb-card-shed",
        listId: todo,
        title: "Clear out the shed",
        description: "Half of it is bicycle parts that belong to nobody.",
        checklists: [
          {
            id: "kb-cl-shed",
            title: "Steps",
            items: [
              item("kb-i-shed-1", "Empty the shelves", false),
              item("kb-i-shed-2", "Take a carload to the tip", false),
              item("kb-i-shed-3", "Put up new hooks", false),
            ],
          },
        ],
      },
      {
        id: "kb-card-bathroom",
        listId: doing,
        title: "Repaint the bathroom",
        description: "",
        checklists: [
          {
            id: "kb-cl-bathroom",
            title: "Prep",
            items: [
              item("kb-i-bath-1", "Sand the woodwork", true),
              item("kb-i-bath-2", "Mask the tiles", false),
              item("kb-i-bath-3", "Buy a second tin", false),
            ],
          },
        ],
      },
      {
        id: "kb-card-garden",
        listId: doing,
        title: "Sort the back garden",
        description: "Start with the beds nearest the house.",
        checklists: [
          {
            id: "kb-cl-garden-beds",
            title: "Beds",
            items: [
              item("kb-i-garden-1", "Weed the borders", true),
              item("kb-i-garden-2", "Cut back the hedge", true),
              item("kb-i-garden-3", "Replant the far corner", false),
            ],
          },
          {
            id: "kb-cl-garden-kit",
            title: "Kit",
            items: [
              item("kb-i-kit-1", "Sharpen the shears", true),
              item("kb-i-kit-2", "Order compost", false),
            ],
          },
        ],
      },
      {
        id: "kb-card-boiler",
        listId: done,
        title: "Book the boiler service",
        description: "",
        checklists: [
          {
            id: "kb-cl-boiler",
            title: "Steps",
            items: [
              item("kb-i-boiler-1", "Find last year's invoice", true),
              item("kb-i-boiler-2", "Ring the engineer", true),
            ],
          },
        ],
      },
    ],
  };
};

const STORAGE_KEY = "housemaster-kanban";

export const loadKanban = (): KanbanState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialData();
    const parsed = JSON.parse(raw) as Partial<KanbanState>;
    if (!Array.isArray(parsed.boards) || !Array.isArray(parsed.lists) || !Array.isArray(parsed.cards)) {
      return makeInitialData();
    }
    return { boards: parsed.boards, lists: parsed.lists, cards: parsed.cards };
  } catch {
    return makeInitialData(); // Corrupt or unavailable storage falls back to the seed
  }
};

export const saveKanban = (state: KanbanState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save the kanban board to localStorage. Changes will not persist.");
  }
};

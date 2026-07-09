export interface Task {
  id: string;
  text: string;
  done: boolean;
}

export type TodoFocus = "primary" | "secondary";

export interface TodoTask extends Task {
  focus: TodoFocus;
}

export interface Lists {
  todo: TodoTask[];
  backlog: Task[];
  chores: Task[];
  structure: Task[];
}

export type ListKey = keyof Lists;

export const makeInitialData = (): Lists => ({
  todo: [],
  backlog: [],
  chores: [],
  structure: [],
});

const STORAGE_KEY = "housemaster-tasks";

export const loadLists = (): Lists => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialData();
    const parsed = JSON.parse(raw) as Partial<Lists>;
    return {
      todo: parsed.todo ?? [],
      backlog: parsed.backlog ?? [],
      chores: parsed.chores ?? [],
      structure: parsed.structure ?? [],
    };
  } catch {
    // Corrupt or unavailable storage (ex: private mode) falls back to empty lists
    return makeInitialData();
  }
};

export const saveLists = (lists: Lists) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    console.warn("Failed to save task lists to localStorage; changes will not persist.");
  }
};

import type { ComponentType } from "react";
import type { Icon } from "@tabler/icons-react";
import {
  IconSofa,
  IconToolsKitchen3,
  IconBath,
  IconBed,
  IconBriefcase,
  IconTriangleSquareCircle,
} from "@tabler/icons-react";
import type { UserRole } from "@/store/authStore";

import TaskHub from "@/pages/LivingRoom/TaskHub";
import Calendar from "@/pages/LivingRoom/Calendar";
import GroceryManager from "@/pages/Kitchen/GroceryManager";
import QuoteOfTheDay from "@/pages/Bathroom/QuoteOfTheDay";
import SnoozeBuddy from "@/pages/Bedroom/SnoozeBuddy";
import AccountingLinks from "@/pages/Study/AccountingLinks";
import KanbanBoard from "@/pages/Study/KanbanBoard";
import CraftLog from "@/pages/HobbyRoom/CraftLog";
import TravelLog from "@/pages/HobbyRoom/TravelLog";

export interface ToolTheme {
  mode: "light" | "dark";
  temperature: "warm" | "cold";
}

const DEFAULT_THEME: ToolTheme = { mode: "light", temperature: "warm" };

export interface ToolDef {
  id: string;
  title: string;
  roomId: string;
  roomTitle: string;
  Component: ComponentType;
  minRole: UserRole;
  theme: ToolTheme;
}

export interface RoomDef {
  id: string;
  title: string;
  Icon: Icon;
  tools: ToolDef[];
}

interface RawTool {
  slug: string;
  title: string;
  Component: ComponentType;
  minRole?: UserRole;
  theme?: ToolTheme;
}

interface RawRoom {
  id: string;
  title: string;
  Icon: Icon;
  tools: RawTool[];
}

// The single source of truth for what exists in the house.
// Both the menu and the tool window read from this, so adding a room or a tool happens in one place.
// A tool's id is `${room}_${slug}`, which is also what rides in the URL.
const rawRooms: RawRoom[] = [
  {
    id: "living-room",
    title: "Living room",
    Icon: IconSofa,
    tools: [
      { slug: "task-hub", title: "Task hub", Component: TaskHub },
      { slug: "calendar", title: "Calendar", Component: Calendar },
    ],
  },
  {
    id: "kitchen",
    title: "Kitchen",
    Icon: IconToolsKitchen3,
    tools: [
      { slug: "grocery-manager", title: "Grocery manager", Component: GroceryManager },
    ],
  },
  {
    id: "bathroom",
    title: "Bathroom",
    Icon: IconBath,
    tools: [
      { slug: "quote-of-the-day", title: "Quote of the day", Component: QuoteOfTheDay },
    ],
  },
  {
    id: "bedroom",
    title: "Bedroom",
    Icon: IconBed,
    tools: [
      {
        slug: "snooze-buddy",
        title: "Snooze buddy",
        Component: SnoozeBuddy,
        theme: { mode: "dark", temperature: "warm" },
      },
    ],
  },
  {
    id: "study",
    title: "Study",
    Icon: IconBriefcase,
    tools: [
      {
        slug: "accounting-links",
        title: "Accounting links",
        Component: AccountingLinks,
        minRole: "ADMIN",
        theme: { mode: "dark", temperature: "cold" },
      },
      { slug: "kanban-board", title: "Kanban board", Component: KanbanBoard },
    ],
  },
  {
    id: "hobby-room",
    title: "Hobby room",
    Icon: IconTriangleSquareCircle,
    tools: [
      {
        slug: "craft-log",
        title: "Craft log",
        Component: CraftLog,
        theme: { mode: "dark", temperature: "warm" },
      },
      { slug: "travel-log", title: "Travel log", Component: TravelLog },
    ],
  },
];

export const rooms: RoomDef[] = rawRooms.map((room) => ({
  id: room.id,
  title: room.title,
  Icon: room.Icon,
  tools: room.tools.map((t) => ({
    id: `${room.id}_${t.slug}`,
    title: t.title,
    roomId: room.id,
    roomTitle: room.title,
    Component: t.Component,
    minRole: t.minRole ?? "GUEST",
    theme: t.theme ?? DEFAULT_THEME,
  })),
}));

export const toolsById: Record<string, ToolDef> = Object.fromEntries(
  rooms.flatMap((room) => room.tools).map((tool) => [tool.id, tool])
);

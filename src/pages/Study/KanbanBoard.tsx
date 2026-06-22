import { IconLayoutKanban } from "@tabler/icons-react";
import ExternalTool from "@/components/ExternalTool";

const KanbanBoard = () => (
  <ExternalTool
    title="Kanban board"
    TitleIcon={IconLayoutKanban}
    url="https://trello.com/w/myownlifeboards/home"
    service="Trello"
    notice="For this MVP, the household's Kanban board lives in Trello and opens in a new tab. A board built natively into Housemaster is planned for a later version."
  />
);

export default KanbanBoard;

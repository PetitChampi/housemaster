import { IconCalendar } from "@tabler/icons-react";
import ExternalTool from "@/components/ExternalTool";

const Calendar = () => (
  <ExternalTool
    title="Calendar"
    TitleIcon={IconCalendar}
    url="https://calendar.google.com/calendar/u/0/r"
    service="Google Calendar"
    notice="For this MVP, the household calendar lives in Google Calendar and opens in a new tab. A calendar built natively into Housemaster is planned for a later version."
  />
);

export default Calendar;

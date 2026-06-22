import {
  IconFilePlus,
  IconFileDollar,
  IconTransfer,
  IconReceipt,
  IconReportMoney,
  IconCreditCard,
  IconWallet,
  IconCalculator,
  IconChartBar,
  IconBuildingBank,
  IconMail,
  type Icon,
} from "@tabler/icons-react";

export interface AccountingLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

// optional per-link icon, as shown in the modal icon grid when creating a new link
export const linkIcons: { key: string; Icon: Icon }[] = [
  { key: "file-plus", Icon: IconFilePlus },
  { key: "file-dollar", Icon: IconFileDollar },
  { key: "transfer", Icon: IconTransfer },
  { key: "receipt", Icon: IconReceipt },
  { key: "report-money", Icon: IconReportMoney },
  { key: "credit-card", Icon: IconCreditCard },
  { key: "wallet", Icon: IconWallet },
  { key: "calculator", Icon: IconCalculator },
  { key: "chart-bar", Icon: IconChartBar },
  { key: "bank", Icon: IconBuildingBank },
  { key: "mail", Icon: IconMail },
];

export const iconByKey: Record<string, Icon> = Object.fromEntries(
  linkIcons.map(({ key, Icon }) => [key, Icon])
);

// Seed content for now, to be replaced by a real backend.
export const initialLinks: AccountingLink[] = [
  { id: "declare-expenses", name: "Declare expenses", url: "https://www.xero.com", icon: "file-plus" },
  { id: "reconcile-expenses", name: "Reconcile expenses", url: "https://www.xero.com", icon: "transfer" },
  { id: "xero-invoices", name: "Xero invoices", url: "https://www.xero.com", icon: "file-dollar" },
  { id: "accounts-mailbox", name: "Accounts mailbox", url: "https://mail.google.com" },
];

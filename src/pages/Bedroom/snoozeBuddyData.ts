import { IconBrandYoutube, IconMicrophone, type Icon } from "@tabler/icons-react";

export type SectionKind = "youtube" | "podcast";

export interface SnoozeItem {
  id: string;
  name: string;
  link: string;
  pictureUrl?: string;
}

export interface SnoozeSection {
  id: string;
  kind: SectionKind;
  title: string;
  items: SnoozeItem[];
}

// per-kind wording and iconography, so one set of components serves all sections
// adding a third kind later is a matter of one more entry here
export interface KindConfig {
  Icon: Icon;
  noun: string;
  addLabel: string;
  newTitle: string;
  editTitle: string;
  nameLabel: string;
  linkLabel: string;
  pictureLabel: string;
}

export const kindConfig: Record<SectionKind, KindConfig> = {
  youtube: {
    Icon: IconBrandYoutube,
    noun: "channel",
    addLabel: "Add channel",
    newTitle: "New YouTube channel",
    editTitle: "Edit YouTube channel",
    nameLabel: "Channel name",
    linkLabel: "Channel link",
    pictureLabel: "Channel picture",
  },
  podcast: {
    Icon: IconMicrophone,
    noun: "podcast",
    addLabel: "Add podcast",
    newTitle: "New podcast",
    editTitle: "Edit podcast",
    nameLabel: "Podcast name",
    linkLabel: "Podcast link",
    pictureLabel: "Podcast picture",
  },
};

// Seed content for now, tbr by real backend
export const initialSections: SnoozeSection[] = [
  {
    id: "youtube-channels",
    kind: "youtube",
    title: "YouTube channels",
    items: [
      { id: "ruby-granger", name: "Ruby Granger", link: "https://www.youtube.com/@RubyGranger" },
      { id: "tysytube", name: "TysyTube Restoration", link: "https://www.youtube.com/@TysyTube" },
      { id: "dankpods", name: "DankPods", link: "https://www.youtube.com/@DankPods" },
    ],
  },
  {
    id: "podcasts",
    kind: "podcast",
    title: "Podcasts",
    items: [
      { id: "random-relaxing", name: "Random relaxing podcast", link: "" },
      { id: "sleep-helper", name: "Sleep helper 2000", link: "" },
      { id: "podcast-tbd", name: "podcast TBD", link: "" },
      { id: "daily-snoozer", name: "The daily snoozer", link: "" },
    ],
  },
];

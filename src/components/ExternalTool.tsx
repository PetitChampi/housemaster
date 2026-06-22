import { IconExternalLink, type Icon } from "@tabler/icons-react";
import { faviconUrl } from "@/lib/favicon";
import "@/styles/components/ExternalTool.css";

interface ExternalToolProps {
  title: string;
  TitleIcon: Icon;
  url: string;
  service: string;
  notice: string;
}

// For tools that have to redirect to a 3rd party in a new tab while there's no native version yet.
// (ex: Trello and Google Calendar both refuse to be embedded)
const ExternalTool = ({ title, TitleIcon, url, service, notice }: ExternalToolProps) => {
  const logo = faviconUrl(url, 128);
  return (
    <div className="external-tool">
      <div className="et-card">
        <span className="et-logo">{logo && <img src={logo} alt="" />}</span>
        <h1 className="et-title">
          <TitleIcon size={28} stroke={1.5} />
          {title}
        </h1>
        <p className="et-notice">{notice}</p>
        <a className="et-open" href={url} target="_blank" rel="noopener noreferrer">
          <IconExternalLink size={20} stroke={1.5} />
          Open in {service}
        </a>
      </div>
    </div>
  );
};

export default ExternalTool;

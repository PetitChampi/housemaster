// Line-art illustrations for the Travel log, drawn as inline SVG so they inherit the tool's ink colour and can be composed along the timeline

interface ArtProps {
  className?: string;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const Pine = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 40 72" width="40" height="72" aria-hidden="true">
    <g {...stroke}>
      <path d="M20 58v12" />
      <path d="M20 4 30 25H10Z" />
      <path d="M20 19 34 42H6Z" />
      <path d="M20 34 38 59H2Z" />
    </g>
  </svg>
);

export const Oak = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 56 72" width="56" height="72" aria-hidden="true">
    <g {...stroke}>
      <path d="M28 70V44" />
      <path d="M28 6a11 11 0 0 1 17.3 10A11 11 0 0 1 45.3 36 11 11 0 0 1 28 46 11 11 0 0 1 10.7 36 11 11 0 0 1 10.7 16 11 11 0 0 1 28 6Z" />
    </g>
  </svg>
);

// unbroken rolling line -> drawing the humps as separate paths crosses them where they overlap
export const Hills = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 128 44" width="128" height="44" aria-hidden="true">
    <g {...stroke}>
      <path d="M2 42c12 0 14-28 32-28s20 28 32 28c12 0 14-20 30-20s18 20 30 20" />
    </g>
  </svg>
);

export const Mountains = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 104 68" width="104" height="68" aria-hidden="true">
    <g {...stroke}>
      <path d="M44 66 68 24l34 42" />
      <path d="M2 66 30 14l26 52" />
      <path d="M23 30h13" />
    </g>
  </svg>
);

export const Fence = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 104 44" width="104" height="44" aria-hidden="true">
    <g {...stroke}>
      <path d="M10 42V14M36 42V14M62 42V14M88 42V14" />
      <path d="M2 22h100M2 33h100" />
    </g>
  </svg>
);

export const Grass = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 40 26" width="40" height="26" aria-hidden="true">
    <g {...stroke}>
      <path d="M6 24C6 15 5 9 2 4" />
      <path d="M16 24C16 13 17 7 14 2" />
      <path d="M26 24C26 14 28 9 32 5" />
      <path d="M35 24c0-6 2-10 4-13" />
    </g>
  </svg>
);

// backpacker (welcome panel illustration + figure walking off end of timeline)
export const Hiker = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 76 104" width="76" height="104" aria-hidden="true">
    <g {...stroke}>
      <circle cx="42" cy="15" r="9" />
      <path d="M40 25 34 56" />
      <path d="M16 33a8 8 0 0 1 8-8h8l-4 30h-8a8 8 0 0 1-8-8Z" />
      <path d="M37 33 50 43l-2 13" />
      <path d="M35 36 24 47" />
      <path d="M34 56 46 72l-2 22M34 56 25 74l-2 20" />
      <path d="M44 94h7M25 94h7" />
      <path d="M44 38 58 96" />
    </g>
  </svg>
);

// dotted walking route (on the welcome panel behind the figure)
export const Trail = ({ className }: ArtProps) => (
  <svg className={className} viewBox="0 0 320 44" width="320" height="44" aria-hidden="true">
    <g {...stroke} strokeDasharray="0.5 11">
      <path d="M2 34c42-26 74 12 114-6s72 18 110-2 54 8 92-6" />
    </g>
  </svg>
);

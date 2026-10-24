import type { ReactNode } from "react";

const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  pen: <><path d="m15.5 4.5 4 4M4 20l4.5-1L20 7.5a2.8 2.8 0 0 0-4-4L4.5 15Z" /><path d="M4 20h7" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" strokeWidth="3" /></>,
  external: <><path d="M14 3h7v7M21 3l-9 9" /><path d="M10 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-4" /></>,
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M9 12h12m-4-4 4 4-4 4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  "arrow-left": <path d="M20 12H4m7-7-7 7 7 7" />,
  bold: <><path d="M6 12h7a4.5 4.5 0 0 1 0 9H6V3h6a4.5 4.5 0 0 1 0 9" /></>,
  italic: <path d="M19 3h-9m4 18H5M15 3 9 21" />,
  underline: <><path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16" /></>,
  strikethrough: <><path d="M17 5a6 6 0 0 0-9-1c-2 2-1.5 5 2 6M8 18a6 6 0 0 0 9 1c2-2 1.5-5-2-6M3 12h18" /></>,
  highlighter: <><path d="m14 3 7 7-9 9H5v-7Zm-9 9 7 7M3 21h7" /><path d="m3 19 2-2" /></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r=".8" /><circle cx="4" cy="12" r=".8" /><circle cx="4" cy="18" r=".8" /></>,
  "list-ordered": <><path d="M10 6h11M10 12h11M10 18h11M3 4h2v5H3m0 6c0-3 4-3 4-1 0 1-4 4-4 5h4" /></>,
  "align-left": <path d="M3 5h18M3 10h12M3 15h18M3 20h12" />,
  "align-center": <path d="M3 5h18M6 10h12M3 15h18M6 20h12" />,
  "align-right": <path d="M3 5h18M9 10h12M3 15h18M9 20h12" />,
  "align-justify": <path d="M3 5h18M3 10h18M3 15h18M3 20h18" />,
  link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" /></>,
  table: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>,
  quote: <><path d="M10 5H4v7h5c0 4-2 6-5 7M20 5h-6v7h5c0 4-2 6-5 7" /></>,
  minus: <path d="M4 12h16" />,
  undo: <><path d="M3 4v6h6M3 10a9 9 0 1 1 1 8" /></>,
  redo: <><path d="M21 4v6h-6m6 0a9 9 0 1 0-1 8" /></>,
  "clear-format": <><path d="M4 4h14M11 4v13M8 17h5M3 21l18-18m-6 13 6 6m0-6-6 6" /></>,
  check: <path d="m5 12 4 4L20 5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  "file-text": <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8M8 17h6" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z" /></>,
  type: <path d="M4 5h16M12 5v15M8 20h8M4 5v3m16-3v3" />,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7c-1.2-.7-.8-2.3.6-2.3H17a4 4 0 0 0 4-4 9 9 0 0 0-9-8Z" /><path d="M7.5 8h.01M12 6h.01M16.5 8h.01M6 12h.01" strokeWidth="2.5" /></>,
} satisfies Record<string, ReactNode>;

export type AdminIconName = keyof typeof icons;

export function AdminIcon({ name, size = 18, className }: { name: AdminIconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
}

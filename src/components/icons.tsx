/** SVG 线性图标 1.7px stroke / currentColor */
import type { SVGProps } from 'react'

const base = (p: SVGProps<SVGSVGElement>) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p
})

export const IconScale = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3Z" />
    <path d="M4.2 7.1 3 18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2l-1.2-10.9" />
    <path d="m12 9 -2.2 4.5a2.6 2.6 0 1 0 4.4 0L12 9Z" fill="currentColor" stroke="none" opacity="0.85" />
  </svg>
)

export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 20h18" />
    <path d="m4 16 4.5-5 3.5 3 5-6.5" />
    <circle cx="17" cy="7.5" r="1.6" />
  </svg>
)

export const IconCamera = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6a2 2 0 0 0 1.7-.94l.5-.82A2 2 0 0 1 12 3.3h0a2 2 0 0 1 1.7.94l.5.82A2 2 0 0 0 15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </svg>
)

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </svg>
)

export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4.2" />
    <path d="M4.5 20c1.3-3.4 4.1-5 7.5-5s6.2 1.6 7.5 5" />
  </svg>
)

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 11.2 12 4l8 7.2" />
    <path d="M6 10v8.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V10" />
    <path d="M10 20v-5h4v5" />
  </svg>
)

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </svg>
)

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m9 5.5 6.5 6.5L9 18.5" />
  </svg>
)

export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.2 7l.8 12.1A1.9 1.9 0 0 0 8.9 21h6.2a1.9 1.9  { 0 0 0 1.9-1.9L17.8 7" />
  </svg>
)

export const IconSync = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
    <path d="M20 4v4h-4M4 20v-4h4" />
  </svg>
)

export const IconCloud = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 8.7 4.5 4.5 0 0 0 7 18Z" />
  </svg>
)

export const IconTarget = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.8" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconFlame = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21c3.9 0 6.5-2.5 6.5-6.1 0-2.6-1.3-4.6-2.7-6.3-.5 1-1.2 1.8-2.1 2.3.2-2.6-1-6-3.9-7.9.3 2.4-.6 4.2-2 5.8-1.1 1.3-2.3 2.9-2.3 5.3C5.5 18.2 8.1 21 12 21Z" />
  </svg>
)

export const IconLeaf = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 19c0-8 4-14 14-14 0 10-6 14-14 14Z" />
    <path d="M5 19c3-5 7-8 11-10" />
  </svg>
)

export const IconRun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="15.5" cy="4.8" r="1.9" />
    <path d="m9 20 2.2-5-2.7-3.2 1.2-4.3L14 9l3.5-1.2" />
    <path d="m8.5 11.8-3 .8M11.2 15l3.6 1 1 4" />
  </svg>
)

export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
  </svg>
)

export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
)

export const IconInfo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 7.8v.4" />
  </svg>
)

export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4 2.8 20h18.4L12 4Z" />
    <path d="M12 10v4.5M12 17.5v.4" />
  </svg>
)

export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

export const IconMail = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
)

export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
    <path d="M9 8l-4 4 4 4M5 12h11" />
  </svg>
)

export const IconCompare = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="8" height="10" rx="2" />
    <rect x="13" y="7" width="8" height="10" rx="2" />
    <path d="M12 4v16" strokeDasharray="2.5 2.5" />
  </svg>
)

export const IconBook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
    <path d="M20 18.5H6.5a2.5 2.5 0 0 0 0 5H20" transform="translate(0 -2.5)" />
  </svg>
)

export const IconArchive = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="5" rx="1.5" />
    <path d="M5.5 9v9.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V9" />
    <path d="M10 13h4" />
  </svg>
)

export const IconPhoto = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
    <circle cx="9" cy="10" r="1.7" />
    <path d="m6 19 5.5-6 3 3.2 2.3-2.4L20 17" />
  </svg>
)

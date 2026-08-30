import type { CSSProperties } from "react";

type LogoProps = {
  className?: string;
  style?: CSSProperties;
};

export function RiftClashMark({ className, style }: LogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      style={style}
      viewBox="900 650 190 190"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="900" y="650" width="190" height="190" rx="36" fill="#873BFF" />
      <path
        d="M995 660.687 1065.66 699.281 1054.38 783.594 995 829.312 935.625 783.594 924.344 699.281Z"
        fill="#11182C"
        stroke="#263555"
        strokeWidth="9"
      />
      <path
        d="m946.313 704.625 42.749-23.75-7.718 42.75 35.031-9.5-51.063 84.312 9.5-55.218-30.281 8.312Z"
        fill="#873BFF"
      />
      <path
        d="m1001.53 682.063 42.16 22.562-25.53 20.187 27.9 15.438-56.404 56.406 10.684-52.844-22.559-2.375Z"
        fill="#FFD21E"
      />
      <path
        d="m992.031 676.719 9.499 40.375-12.468 19 8.906 1.187-11.875 35.625 1.781-32.062-11.281-1.188Z"
        fill="#F4F6FF"
      />
    </svg>
  );
}

export function RiftClashLogo({ className, style }: LogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      style={style}
      viewBox="150 215 620 280"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M265.2 227.96 350.88 274.76 337.2 377l-72 55.44L193.2 377l-13.68-102.24Z"
        fill="#070B18"
        stroke="#263555"
        strokeWidth="9"
      />
      <path
        d="M206.16 281.24 258 252.44l-9.36 51.84 42.48-11.52L229.2 395l11.52-66.96L204 338.12Z"
        fill="#873BFF"
      />
      <path
        d="m273.12 253.88 51.12 27.36-30.96 24.48 33.84 18.72-68.4 68.4 12.96-64.08-27.36-2.88Z"
        fill="#FFD21E"
      />
      <path
        d="m261.6 247.4 11.52 48.96L258 319.4l10.8 1.44-14.4 43.2 2.16-38.88-13.68-1.44Z"
        fill="#F4F6FF"
      />
      <rect x="430" y="263" width="56" height="5" rx="2.5" fill="#873BFF" />
      <text
        x="430"
        y="339"
        fill="#F4F6FF"
        fontFamily="var(--font-inter-tight), Inter, Arial, sans-serif"
        fontSize="66"
        fontWeight="800"
        letterSpacing="7"
      >
        RIFT
      </text>
      <text
        x="430"
        y="420"
        fill="#FFD21E"
        fontFamily="var(--font-inter-tight), Inter, Arial, sans-serif"
        fontSize="66"
        fontWeight="800"
        letterSpacing="7"
      >
        CLASH
      </text>
      <text
        x="433"
        y="457"
        fill="#8E99B6"
        fontFamily="var(--font-inter-tight), Inter, Arial, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="3.2"
      >
        FRIENDS TOURNAMENT
      </text>
    </svg>
  );
}

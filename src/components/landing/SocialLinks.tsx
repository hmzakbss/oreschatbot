"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/landing/Reveal";

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor" aria-hidden>
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.4V9.84c0-2.37 1.4-3.68 3.55-3.68 1.03 0 2.1.18 2.1.18v2.32h-1.18c-1.17 0-1.53.73-1.53 1.48v1.77h2.61l-.42 2.91h-2.19V22c4.78-.75 8.44-4.91 8.44-9.93z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor" aria-hidden>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.52.01-4.76.07-2.25.1-3.3 1.17-3.4 3.4-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.1 2.22 1.16 3.3 3.4 3.4 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c2.25-.1 3.3-1.18 3.4-3.4.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.1-2.25-1.17-3.3-3.4-3.4-1.24-.06-1.61-.07-4.76-.07zm0 3.06a5.18 5.18 0 1 1 0 10.36 5.18 5.18 0 0 1 0-10.36zm0 8.55a3.37 3.37 0 1 0 0-6.74 3.37 3.37 0 0 0 0 6.74zm5.34-9.8a1.21 1.21 0 1 1 0 2.42 1.21 1.21 0 0 1 0-2.42z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.57V8.43L15.82 12l-6.07 3.57z" />
    </svg>
  );
}

const SOCIALS: {
  name: string;
  href: string;
  label: string;
  className: string;
  icon: ReactNode;
}[] = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/OresTanitimSistemleri/?locale=tr_TR",
    label: "Facebook'ta ORES",
    className: "social-facebook",
    icon: <IconFacebook />,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/orestanitimsistemleri/",
    label: "Instagram'da ORES",
    className: "social-instagram",
    icon: <IconInstagram />,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/ores-display-systems/?originalSubdomain=tr",
    label: "LinkedIn'de ORES",
    className: "social-linkedin",
    icon: <IconLinkedIn />,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@oresdisplaysystems",
    label: "YouTube'da ORES",
    className: "social-youtube",
    icon: <IconYouTube />,
  },
];

export function SocialLinks({
  compact = false,
  reveal = true,
}: {
  compact?: boolean;
  reveal?: boolean;
}) {
  const list = (
    <ul
      className={`social-row flex flex-wrap items-center justify-center gap-3 ${
        compact ? "gap-2.5" : "sm:gap-3.5"
      }`}
    >
      {SOCIALS.map((social, i) => (
        <li
          key={social.name}
          className="social-item"
          style={{ animationDelay: `${0.08 + i * 0.08}s` }}
        >
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            title={social.label}
            className={`social-btn ${social.className} ${
              compact ? "social-btn-compact" : ""
            }`}
          >
            <span className="social-btn-glow" aria-hidden />
            <span className="social-icon-wrap">{social.icon}</span>
            {!compact ? (
              <span className="social-label">{social.name}</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );

  if (!reveal) return list;

  return (
    <Reveal variant="up" className="w-full">
      {list}
    </Reveal>
  );
}

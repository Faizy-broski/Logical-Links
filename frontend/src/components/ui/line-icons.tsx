import { cn } from "@/lib/utils";

/**
 * Custom line icons (24px grid, 2px round stroke) for compound concepts that
 * lucide doesn't ship. They inherit colour via `currentColor` and size via
 * `className`, so they are drop-in replacements for lucide icons.
 */
export type LineIcon = (props: { className?: string }) => React.JSX.Element;

function make(paths: string[]): LineIcon {
  return function Icon({ className }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={cn("shrink-0", className)}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const LineIcons = {
  /** User combined with an interlocking link */
  userLink: make([
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M3 20a6 6 0 0 1 6-6h1",
    "M15 14h-1a3 3 0 0 0 0 6h1",
    "M19 14h1a3 3 0 0 1 0 6h-1",
    "M14.5 17h5",
  ]),
  /** Lightbulb containing a puzzle piece */
  bulbPuzzle: make([
    "M9 18h6",
    "M10 21h4",
    "M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z",
    "M10 8.5h1.2a1 1 0 1 1 1.6 0H14v1.2a1 1 0 1 0 0 1.6V12h-4z",
  ]),
  /** Shield with a handshake inside */
  shieldHandshake: make([
    "M12 2.5l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10v-6z",
    "M8 11l2.5-1.5h3L16 11",
    "M8 11l3.5 3.5a1 1 0 0 0 1.4 0L16 11",
  ]),
  /** Shipping box with a speed line */
  boxSpeed: make([
    "M21 8l-7-4-7 4v8l7 4 7-4z",
    "M7 8l7 4 7-4",
    "M14 12v8",
    "M1 10h4",
    "M2 14h3",
    "M3 18h2",
  ]),
  /** Gear with a question mark in the middle */
  gearQuestion: make([
    "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
    "M12 2v3",
    "M12 19v3",
    "M2 12h3",
    "M19 12h3",
    "M4.9 4.9L7 7",
    "M17 17l2.1 2.1",
    "M4.9 19.1L7 17",
    "M17 7l2.1-2.1",
    "M10.2 10.3a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.8-1.9 1.8",
    "M12 15.2h.01",
  ]),
  /** Clipboard with a dollar sign */
  clipboardDollar: make([
    "M9 3h6v3H9z",
    "M15 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2",
    "M12 10v8",
    "M14 11.5c-.4-.6-1.1-1-2-1-1.1 0-2 .6-2 1.5s.9 1.3 2 1.5 2 .6 2 1.5-.9 1.5-2 1.5c-.9 0-1.6-.4-2-1",
  ]),
  /** Calendar grid paired with a delivery package */
  calendarPackage: make([
    "M8 2v4",
    "M16 2v4",
    "M3 10h18",
    "M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6",
    "M21 15.5l-4-2-4 2V20l4 2 4-2z",
    "M13 15.5l4 2 4-2",
    "M17 17.5V22",
  ]),
  /** Keyhole combined with a user profile */
  keyholeUser: make([
    "M7 3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z",
    "M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    "M10.5 18l.8-4h1.4l.8 4z",
  ]),
  /** Clock with a stopwatch marker */
  clockStopwatch: make([
    "M10 2h4",
    "M12 2v3",
    "M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
    "M12 10v4l2.5 2",
    "M19 7l1.5-1.5",
  ]),
  /** Customer service agent profile wearing a headset */
  agentHeadset: make([
    "M12 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    "M5 21a7 7 0 0 1 14 0",
    "M6.5 10a5.5 5.5 0 0 1 11 0",
    "M6.5 10v2.5",
    "M17.5 10v2.5",
    "M17.5 12.5c0 1.5-1.5 2.5-3 2.5",
  ]),
} satisfies Record<string, LineIcon>;

import type { JourneyMode } from "@/lib/journey";

function Glyph({
  className,
  testId,
  children,
}: {
  className?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid={testId}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

type GlyphProps = { className?: string; testId?: string };

export function PlaneIcon({ className, testId }: GlyphProps) {
  return (
    <Glyph className={className} testId={testId}>
      <path d="M12 2.5c1.1 0 1.8 1.4 1.8 3.2v3.6l7.2 4.3v2.1l-7.2-2.2v3.6l2.6 1.9v1.8L12 19.6l-4.4 1.2v-1.8l2.6-1.9v-3.6L3 15.7v-2.1l7.2-4.3V5.7c0-1.8.7-3.2 1.8-3.2z" />
    </Glyph>
  );
}

export function BusIcon({ className, testId }: GlyphProps) {
  return (
    <Glyph className={className} testId={testId}>
      <path d="M4.5 5.5h15v9.5h-15z" />
      <path d="M4.5 10.5h15" />
      <path d="M3 15h18v2.5H3z" />
      <path d="M6.5 17.5v1.5M17.5 17.5v1.5" />
      <path d="M9 8h6" />
    </Glyph>
  );
}

export function BootIcon({ className, testId }: GlyphProps) {
  return (
    <Glyph className={className} testId={testId}>
      <path d="M5.5 3.5h4.2l.4 5.6 6.9 3.3a4.5 4.5 0 0 1 2.5 4v3.1H5.5z" />
      <path d="M5.5 16.5h13.8" />
      <path d="M9.9 9.1 12 11m.6-.4L14.7 12" />
    </Glyph>
  );
}

const GLYPHS: Record<JourneyMode, (props: GlyphProps) => React.ReactElement> = {
  Flight: PlaneIcon,
  Bus: BusIcon,
  Walk: BootIcon,
};

export function ModeIcon({
  mode,
  className,
}: {
  mode: JourneyMode;
  className?: string;
}) {
  const Icon = GLYPHS[mode];
  return <Icon className={className} testId={`mode-icon-${mode.toLowerCase()}`} />;
}

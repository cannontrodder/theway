export function LowerPanel({
  heading,
  testId,
  children,
}: {
  heading: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <details
      data-testid={testId}
      className="border-border rounded-medium bg-white group open-on-wide border"
    >
      <summary className="px-md py-md gap-sm flex min-h-11 cursor-pointer list-none items-center sm:cursor-default">
        <h2 className="font-display mr-auto text-base tracking-[0.06em] uppercase">
          {heading}
        </h2>
        <span
          aria-hidden="true"
          className="text-muted size-6 grid shrink-0 place-items-center sm:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" className="group-open:hidden" />
            <path d="M5 12h14" className="hidden group-open:block" />
          </svg>
        </span>
      </summary>

      <div className="px-md pb-md gap-sm flex flex-col">{children}</div>
    </details>
  );
}

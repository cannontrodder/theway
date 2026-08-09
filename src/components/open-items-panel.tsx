import Link from "next/link";

import { sentence } from "@/lib/display";
import type { OpenItemMode } from "@/lib/open-items";
import { openItemGroups, openItemLink } from "@/lib/open-items";
import type { OpenItem } from "@/lib/trip";
import { trip } from "@/lib/trip";

import { BedIcon } from "./bed-icon";
import { LowerPanel } from "./lower-panel";
import { ModeIcon } from "./mode-icon";
import { StatusChip } from "./status-chip";

function ItemIcon({ mode }: { mode?: OpenItemMode }) {
  if (mode === "Stay") return <BedIcon className="size-4 shrink-0" />;
  if (mode) return <ModeIcon mode={mode} className="size-4 shrink-0" />;
  return <span aria-hidden="true" className="bg-olive size-2 shrink-0 rounded-full" />;
}

function Item({ item }: { item: OpenItem }) {
  const link = openItemLink(item);

  return (
    <li
      data-testid="open-item"
      className="border-border py-xs gap-sm flex flex-wrap items-center border-b last:border-b-0"
    >
      <span className="gap-sm mr-auto flex min-w-0 flex-1 items-center">
        <span className="text-muted w-4 shrink-0 grid place-items-center">
          <ItemIcon mode={link?.mode} />
        </span>
        {link ? (
          <Link
            href={link.path}
            data-testid="open-item-link"
            className="tap-target prose-body max-w-[36ch] underline"
          >
            {sentence(item.item)}
          </Link>
        ) : (
          <span className="prose-body max-w-[36ch]">{sentence(item.item)}</span>
        )}
      </span>

      <StatusChip
        status={item.status}
        className="text-muted shrink-0"
        testId="open-item-status"
      />
    </li>
  );
}

export function OpenItemsPanel() {
  const groups = openItemGroups();

  return (
    <LowerPanel heading="To book / to verify" testId="open-items-panel">
      <p data-testid="open-items-count" className="text-muted prose-body">
        All {trip.openItems.length} open items, highest priority first. Nothing
        is left out.
      </p>

      {groups.map((group) => (
        <div key={group.priority} className="gap-xs flex flex-col">
          <h3
            data-testid="open-items-group"
            className="text-muted mt-sm text-xs tracking-[0.08em] uppercase"
          >
            {group.label}
          </h3>
          <ul className="flex flex-col">
            {group.items.map((item) => (
              <Item key={item.item} item={item} />
            ))}
          </ul>
        </div>
      ))}

      <p className="text-muted prose-body">
        Each item links to the page it belongs to, where one exists.
      </p>
    </LowerPanel>
  );
}

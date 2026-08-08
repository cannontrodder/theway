# Context

The glossary for **theway** — the site covering our October 2026 Camino Francés walk from Logroño to Burgos.

## Identity

**Wordmark** — `THE WAY` in uppercase display type, with the strapline _Our Camino. Our Journey._ beneath it. Appears in the header and footer.

**Shell mark** — the stylised scallop shell in `ochre` that sits to the left of the Wordmark. The site's only figurative motif. Not "the fan" — an earlier abstract-fan alternative was rejected in favour of the shell.

**Route line** — the drawn line of the Camino itself, on any map. The site's other motif.

## Certainty

Every fact on the site carries its **Status** — how settled that fact is. A Status is never hidden, so a provisional detail always reads as provisional. The set comes from `trip-data.json`, which is the source of truth; the display label is uppercase.

| In the data | On the site | Means |
|---|---|---|
| `fixed` | FIXED | Settled and not up for debate. |
| `booked` | BOOKED | Paid for, with a reference. |
| `planned_not_booked` | PLANNED | Decided, but nothing is reserved yet. |
| `proposed` | PROPOSED | A suggestion still open to change. |
| `to_book` | TO BOOK | Needs reserving. |
| `to_verify` | TO VERIFY | Needs checking against a real timetable or price. |
| `to_do` | TO DO | Research still owed. |
| `approximate` | APPROX | A number good enough to plan on, not measured. |
| `optional` | OPTIONAL | Only if we fancy it. |

Two values in the data are not Statuses and never surface as one:

- `proposed_with_fixed_finish` — Day 5. It reads as PROPOSED; the fixed Burgos finish is stated in the text.
- `superseded` — the earlier stage plan, kept in the data for reference. Superseded facts are not shown at all.

## Stages

**Stage** — one walking day, Logroño to Burgos, numbered 1 to 5. Not "leg" and not "day" alone, because Day covers the eight calendar days of the whole trip, walking or not.

**Overnight** — the town we sleep in at the end of a Stage. Distinct from the accommodation itself, which may not be chosen yet.

**Waypoint** — a village the route passes through. We do not stop the night there.


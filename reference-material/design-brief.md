# Design brief: The Way

The visual and editorial system for **theway.cannontrodder.net** — a personal, mobile-first site covering our October 2026 Camino Francés walk from Logroño to Burgos.

## Sources of truth

- **Trip facts** — dates, distances, place names, bookings — come from `reference-material/trip-data.json`. Any number in this brief is illustrative; where the two disagree, the JSON wins.
- **Design tokens** — once the tokens below are expressed in code (CSS custom properties, a Tailwind theme), that code becomes the source of truth and this section becomes the rationale behind it.

## The feel: a field guide

The site should read like a **field guide** — a tactile, printed walking companion with a map at its centre. Editorial typography, warm paper ground, restrained ink-drawn motifs, real photographs of a real trail.

Tone is personal, understated, outdoorsy and warm, with a dry Northern practicality. Write as a competent walker talking to a friend.

Two motifs carry the identity: the **route line** and a **simplified radiating fan**. Keep Camino references at that level of abstraction — implicit, not literal.

**Guardrails.** These read as the wrong project, so keep them out: generic Camino tourism branding, religious imagery, literal scallop shells, parchment textures, script fonts, bright holiday colours, and card-grid dashboard layouts.

## Design tokens

```json
{
  "colors": {
    "ink": "#0F1D34",
    "blue": "#2E5B7B",
    "olive": "#6B7F4E",
    "ochre": "#D2A74A",
    "paper": "#F2EFE6",
    "white": "#FAF9F5",
    "muted": "#73766F",
    "border": "#D8D3C6"
  },
  "typography": {
    "display": "Playfair Display",
    "sans": "Inter",
    "fallback": "system-ui, sans-serif"
  },
  "radius": { "small": "6px", "medium": "10px", "large": "16px" },
  "spacing": { "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "40px", "xxl": "64px" }
}
```

`ink` on `paper` is the default pairing. `ochre` is the single accent — spend it on the route line, active states, and one thing per screen.

## Logo

**Wordmark:** `THE WAY` in uppercase, wide tracking, `ink`, set in the display face or a strong transitional serif. The wordmark stands alone — no slogan, no tagline, no badge.

**Secondary mark:** an abstract fan of 7–9 radiating lines, flat, single-colour, legible at 16px favicon size.

## Map

The map is the centrepiece, not decoration.

- **Base:** pale, muted, low-contrast, so the route dominates.
- **Route:** the Camino line in `ink` or `ochre`. Distinguish walking days by line treatment — weight, dash, opacity — within that two-colour range.
- **Markers:** solid circle for stage start/end; bed for overnight; fork for food; droplet for water; bus or plane for transport; outlined pin for other points of interest.
- **Labels:** only significant towns at default zoom.
- **Interaction:** an overall route view that fits bounds automatically, a filter by walking day, and tap-a-stage-to-open-detail. Ship the minimum control set — zoom and recentre.

## Pages

```
/                Overview
/itinerary       Full 4–11 October timeline
/map             Full route map
/day/1 … /day/5  Individual walking stages
/bilbao          City page
/burgos          City page
/travel          Flights and buses
/stays           Accommodation
/packing         Packing and kit
/info            Emergency contacts, documents, useful numbers
```

## Homepage structure

Top to bottom:

1. **Header** — `THE WAY`, and the trip dates.
2. **Hero** — a full-width landscape or route-map visual, carrying the three headline figures: the Logroño→Burgos span, the day count, and total distance.
3. **Trip timeline** — the full door-to-door chain: Newcastle, Amsterdam, Bilbao, Logroño, the walking days, Burgos, Bilbao, Amsterdam, Newcastle.
4. **Walking day cards** — one per stage (see below).
5. **Route map** — large and interactive.
6. **Open items** — bookings still to make and details still to verify.
7. **City features** — Bilbao and Burgos.
8. **Footer** — wordmark and domain.

## Stage card

Each walking day card carries these fields, with links out to the route, the stage detail, and the night's accommodation:

```json
{
  "day": 1,
  "date": "Mon 5 Oct",
  "route": "Logroño to Nájera",
  "distance": "28.7 km",
  "duration": "TBC",
  "difficulty": "Long",
  "overnight": "Nájera",
  "status": "PROPOSED"
}
```

## Status states

Every fact that isn't settled carries its real state, from this exact set:

```
FIXED  BOOKED  PROPOSED  TO BOOK  TO VERIFY  APPROXIMATE
```

Show the state wherever the fact appears, so a provisional detail always reads as provisional.

## Glanceable UI

Mobile first, and specifically designed to be read one-handed, mid-walk, in bright sun. The site is **glanceable**: large tap targets, strong contrast, generous text size, flat navigation, and the answer above the fold.

The questions it must answer in one tap: where am I walking today, how far is left, where's the map, where's the hotel, where's food and water, when's the next bus, and what still needs booking.

## Photography

Real and candid: the trail itself, boots, packs, hands, stone, villages, road signs and Camino arrows, food and beer on a bar table, morning light, and genuinely bad weather. Imperfect beats polished.

Stock-library register — staged models, drone tourism sweeps, saturated sunsets, heavy HDR — reads as a different site entirely; keep it out.

## Homepage mock-up

`reference-material/homepage-mockup.png` shows the intended homepage at desktop and mobile width. It is the tightest available statement of the visual system — where this prose and the mock-up disagree on layout, spacing, or component shape, follow the mock-up.

Two details in it depart from the text above and are the mock-up's call:

- The wordmark carries the strapline **_Our Camino. Our Journey._** and pairs with a **scallop-shell mark** rather than an abstract fan.
- The route map distinguishes all five days by **colour** (olive, blue, ochre, amber, navy) with a legend, rather than by line treatment alone.

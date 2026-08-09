# Darken muted and olive so body text meets AA

The brief's `muted` (`#73766F`) and `olive` (`#6B7F4E`) both fail WCAG AA for body text against `paper` and `white`. Measured: `muted` reached 4.01:1 on `paper` where 4.5:1 is required, and white text on `olive` reached 4.18:1. A site meant to be read one-handed in bright sun cannot ship either.

`muted` is now `#5F625A` (5.40:1 on `paper`) and `olive` is `#5F7245` (5.01:1 behind white text). Both keep their hue and their place in the palette; only lightness moved, and only as far as AA required.

The fix is in the tokens, not per component, because the brief states that once the tokens live in code that code is the source of truth. The brief's own token JSON still lists the original hexes as the rationale behind them.

Stage 1's line colour in `src/lib/route.ts` moved with `olive`, because the homepage's `bg-olive` blocks and the Stage 1 legend swatch read as the same green and would otherwise have drifted one shade apart. The other four Stage colours are not tokens and are unchanged.

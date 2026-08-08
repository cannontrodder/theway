# Work the next ticket

Paste the block below into a fresh session to pick up and finish one ticket.

---

Work the next ticket in this repo, start to finish.

**Find it.** The frontier is every open issue labelled `ready-for-agent` with no
open blockers and no assignee. List candidates, then check each one's blockers:

```
gh issue list --state open --label ready-for-agent --json number,title,assignees
gh api repos/cannontrodder/theway/issues/<n> --jq .issue_dependencies_summary.blocked_by
```

Take the lowest-numbered issue whose count is `0` and that nobody is assigned to.
Claim it with `gh issue edit <n> --add-assignee @me` before you write any code, so
a parallel session cannot pick the same one. Read it in full with
`gh issue view <n> --comments` — the comments carry decisions made after the
ticket was written, and they override the body where they disagree.

**Ground yourself.** Read `CONTEXT.md` and use its vocabulary exactly: Status,
Stage, Overnight, Waypoint, Wordmark, Shell mark, Route line. Read the ADRs in
`docs/adr/` that touch your area — they record decisions that look like mistakes
without their reasoning, and ADR-0001 is one an agent would otherwise "fix".
`reference-material/design-brief.md` holds the visual system,
`reference-material/homepage-mockup.png` is the tightest statement of it, and
`src/data/trip-data.json` is the only source of trip facts. Every date,
distance, place name and Status comes from that file, read through
`src/lib/trip.ts`, which is the only code that knows its raw shape. Where the brief and the
mockup disagree on layout, the mockup wins.

**Build it** with `/implement`, which drives `/tdd` at the seams the parent spec
agreed: unit tests on the trip data module's public interface, and Playwright
against the built static export. Run typechecking and single test files as you
go, and the full suite once at the end.

Stay inside the ticket's scope. When you spot a real problem in someone else's
ticket, comment on that issue and leave the code alone.

Surface contradictions rather than resolving them silently. When the brief, the
mockup and the data disagree, or when an acceptance criterion cannot hold, say so
on the issue and state which source you followed and why.

**Verify it against every acceptance criterion**, one at a time. Tick each box on
the issue as you confirm it, and for UI work confirm it in a browser through
Playwright rather than by reading the code. Where a criterion cannot be verified
yet — a certificate still provisioning, a fact the data does not hold — say so
explicitly on the issue and leave its box unticked.

**Close it.** `/implement` commits and reviews, and stops there. The ticket is
not finished until:

- every acceptance criterion is ticked or explicitly recorded as unverifiable,
- `/code-review` has run over the diff,
- the work is committed,
- a comment on the issue records what you built, what you verified, and what you
  deliberately left alone,
- `gh issue close <n>` has run, and `gh issue view <n> --json state` returns
  `CLOSED`.

That last command is the ticket's completion criterion. Run it, and report which
issues unblocked as a result.

**Report at the end:** the issue you closed, what is now on the frontier, and
anything you could not verify.

---

Then `/clear` and paste it again for the next one.

# Design

Binding, not advisory. Tokens are defined once and consumed everywhere. If a value is missing from a scale, extend the scale rather than writing a one-off.

## 1. Brief

A compliance instrument used by two very different people: a small business owner under financial pressure, and a public officer working a queue. It must feel trustworthy, precise, and institutional without being bureaucratic or dated.

The reference is not a startup SaaS dashboard. It is a well-made professional instrument: legal publishing, official documents, verification tooling. The user is not being sold to; they are being helped through something consequential.

The product is bilingual French and Arabic. That constraint drives the typography rather than being retrofitted onto it.

## 2. Colour

```
--paper        #FAF8F4   warm document ground, not white
--paper-sunk   #F1EDE6   recessed surfaces, table stripes, input wells
--ink          #16211F   near-black with a green cast, like stamp ink
--ink-soft     #5A6764   secondary text, metadata, disabled
--rule         #DBD5CA   hairlines, borders, separators
--seal         #1F4D3F   primary: links, primary buttons, focus rings
--seal-wash    #E6EFEA   primary tint: selected rows, active filters
--cachet       #A8342A   blocking status only
--amber        #A97420   attention status only
--verified     #2F6B4F   passed status only
```

**Colour carries status and nothing else.** The three status colours are reserved. Red on screen always means a blocking issue, never a delete button, never an accent, never a chart series. `--seal` is the only interactive colour. Everything else is ink on paper.

Rationale: the palette comes from the material world of the subject, which is paper, ink, official stamps, and registry ledgers. It deliberately avoids the two palettes that dominate generated interfaces, cream with terracotta and near-black with an acid accent.

Check every status colour for contrast against both `--paper` and `--paper-sunk`, since table rows alternate.

## 3. Typography

**IBM Plex Sans and IBM Plex Sans Arabic**, one family across both scripts. The Latin and Arabic designs are genuinely matched, which matters here more than anywhere else: a French field label and an Arabic extracted value will sit in the same table row, and most pairings fall apart at exactly that point. Plex also has a civic, engineered character that suits an instrument rather than a brand.

**IBM Plex Serif** for legal text quoted verbatim in citation panels. The change in texture does real work: it signals that the law is speaking, not the interface.

| Role | Size / line | Weight | Notes |
|---|---|---|---|
| Display | 32 / 36 | 600 | Page titles |
| Heading | 20 / 28 | 600 | Section headings |
| Subhead | 16 / 24 | 600 | Panel titles |
| Body | 15 / 24 | 400 | Default |
| Body small | 13 / 20 | 400 | Table cells, metadata |
| Numeric | 14 / 20 | 450 | Tabular figures |
| Legal | 15 / 26 | 400 | Serif, quoted articles |

Tabular figures on every amount, identifier, date, and confidence value. Numbers that jitter between rows read as amateur in a financial tool, and it is a one-line fix.

Body line length stays under 80 characters. Serif legal text may run slightly longer and takes more line height, which the scale above already reflects.

Avoid: all-caps labels, a single accented word inside a heading, eyebrow labels above every section, meta strings joined with middle dots. These are the commonest tells of a generated page.

## 4. Layout

**Officer console: dense.** A professional tool is judged on how much is legible without scrolling. Tight row heights, hairline separators, horizontal space given to content rather than padding.

**MSME interface: calmer.** The user is stressed and non-expert. More whitespace, one primary action per screen, sequential progression.

This asymmetry is intentional and is stated out loud in the pitch: two interfaces, two audiences, two densities. Do not normalise them toward each other.

**Structure with hairlines, not cards.** Do not chop content into identical rounded boxes with identical soft shadows. That is the most recognisable generated-dashboard pattern. Build hierarchy with `--rule` separators, background shifts to `--paper-sunk`, and spacing. Reserve elevation for things that genuinely float: the citation panel, modals, dropdowns.

Border radius encodes hierarchy rather than being one value everywhere: 2px on inputs and table elements, 6px on buttons and panels, 10px on modals.

## 5. Motion

Motion exists to explain what changed. Spend the animation budget in one place.

### The orchestrated moment

A new file arriving in the officer's queue. This is the demo's proof that the B2G bridge is real.

1. The pending counter increments.
2. Existing rows shift down in a genuine layout reflow, not a fade.
3. The new row enters with a brief `--seal` left border that fades over about two seconds.
4. The row background settles from `--seal-wash` to transparent.

Roughly 900ms end to end. It must be readable from the back of the room.

Use layout animations so the list visibly rearranges. This looks far better than a fade-in because the audience sees the list actually reorder.

### Motion that answers an action

| Interaction | What moves |
|---|---|
| Hover an extracted field | Its region highlights in the document, 120ms |
| Click a finding | Citation panel slides in from the right, 220ms, spring |
| Expand an article | Height opens, 200ms |
| Confirm an uncertain field | Confidence pill transitions, row settles |
| Answer an escalation | The rule resolves, its finding settles into place |
| Validate a file | Row exits the queue, counter ticks up |
| Filter the queue | Rows reorder in place, no fade |
| Export the TEJ file | Validation result resolves against the schema |

### Forbidden

- Fade-and-slide-up on every section at page load
- Hover lift and shadow on every card
- Scroll-triggered reveals
- Anything over 400ms outside the orchestrated moment
- Animated gradients, floating shapes, particles
- Statistics counting up on page load

These read as generated, and in an institutional tool they read as unserious.

### Technical rules

- Animate transform and opacity only. Never animate width, height, top, or left outside a layout animation.
- Shared transition presets live in one module and are imported, never redefined inline.
- Every list row has a stable key.
- Everything is gated behind a reduced-motion check. When reduced motion is on, transitions become instantaneous; state changes still happen visibly.
- Nothing above the fold animates on first paint. The page is readable immediately.

## 6. Copy

French, sentence case, active voice, plain verbs, no filler.

An action keeps the same name through the whole flow: the button that says "Soumettre" produces a confirmation that says "Soumis". The vocabulary of the interface is the signposting for someone navigating it.

Name things by what the user understands, not by how the system is built. The user confirms a value, they do not resolve a low-confidence extraction.

Empty states are an invitation to act, not a mood. Errors state what happened and how to fix it, in the interface's voice. They do not apologise and they are never vague.

**Tone at the uncertainty moment.** When the system asks a user to confirm a field it could not read, the interface is asking for help, not reporting a failure: "Confirmez ce montant, le scan est peu lisible." This is the product's most characteristic moment and the copy carries it.

## 7. Screens

**MSME dashboard.** Status as a plain sentence, not a gauge. The file list. One primary action.

**File creation.** The required document checklist appears before upload, each item with its legal basis available on tap. Knowing what is expected before you start is itself a large part of the value.

**Upload.** Mixed formats and languages. Visible progress per document: reçu, lu, classé, vérifié.

**Extraction review.** Document preview left, fields right. Uncertain fields are pulled to the top of their group, not left in alphabetical order. Hovering a field highlights its source region in the document.

**Escalation.** When an assisted rule cannot establish a fact, it asks one specific question, with the reason it matters and what changes depending on the answer. This screen is the visible proof that the system knows where it stops, and it is a scripted demo beat.

**Compliance report.** Blocking, attention, passed. Each finding: the issue in plain French, the exact article in serif in an expandable panel, a concrete fix. No score.

**Counterparty view.** Registry facts with their articles, then the block listing explicitly what we cannot verify. That third block is what makes the first two credible.

**Export.** The TEJ file with its validation result against the published DGI schema shown on screen.

**Officer queue.** Four header indicators: pending by status, agent hours saved this month, pre-qualification rate, average processing time with a month-over-month comparison. Columns: company, object, amount, pre-qualification status, anomaly count, age, assigned agent. Persistent sidebar filters. Default sort is oldest first among compliant files, so the agent sees what they can clear quickly.

**Officer file view.** Three columns. Left: documents and viewer, where hovering an extracted field highlights the corresponding region. That gesture is what sells the console. Centre: fields grouped by category, uncertain ones surfaced at the top. Right: automated checks with expandable articles, then the points left to human judgment, visually distinct. Fixed action bar at the bottom. The return-for-correction form is pre-filled from the blocking findings: the agent reviews and sends, they do not compose.

**Audit trail.** Vertical chronology, timestamped and attributed. Replay shows which rule version, which article, and which confidence produced each conclusion.

**Admin.** Rule registry browsable. Benefit parameters editable with instant recalculation.

## 8. Quality floor

Built without announcing it: visible keyboard focus on every interactive element, reduced motion respected, contrast verified on every status colour, skeleton content on loading, empty states that direct, errors that explain. Responsive down to a tablet width; phone support is on the cut list, not on the floor.

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial design document |

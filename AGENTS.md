## Project

Riffle Web is a static Astro + TypeScript site for publishing curated issue
exports from `src/content/issues/*.json`. It has no runtime backend, browser
application framework, analytics, or dynamic publication workflow.

### Constraints

- Use pnpm and keep `pnpm-lock.yaml` plus package-manager metadata committed.
- Keep the vendored Draft-04 issue schema and generated validator authoritative
  for structural validation at build time; PostgreSQL,
  riffle-core, Reddit, and AI providers do not belong in this repository.
- Treat exported issue data as authoritative. Do not duplicate ranking or
  editorial domain logic, invent published/demo content, or transform titles or
  Polish descriptions.
- Preserve the visual direction in `design-book.md`: lowercase `riffle.`,
  paper/ink palette, restrained red, self-hosted fonts, editorial whitespace,
  thin rules, semantic HTML, responsive layout, and zero browser JavaScript.
- Deploy only static output to GitHub Pages at `riffle.trepka.dev`.
- Do not add unrelated functionality, modify `design-book.md`, add a remote,
  or commit changes unless explicitly requested.

## Agent Collaboration Workflow

Use this workflow for development topics:

1. **Assess and investigate.** Inspect relevant files, tests, documentation, and
   repository state. Scale discovery to the risk and ambiguity.
2. **Grill me.** Use the `question` tool for consequential decisions. Continue
   until goals, boundaries, behavior, failure cases, and acceptance criteria
   are clear, then summarize and obtain explicit approval.
3. **Record the working spec.** After approval, write `.work/<topic>.md` before
   implementation. Include goal/context, scope, decisions, acceptance
   criteria, approach, and verification plan.
4. **Implement and verify.** Make the smallest correct change in the Astro
   structure. Run relevant tests, `pnpm check`, and production build. Pause and
   ask if implementation reveals a consequential ambiguity.
5. **Clean up.** Delete the temporary spec only after all acceptance checks
   pass. Keep it and report the blocker when verification or real-export
   acceptance is incomplete.

## Repository shape

- `src/pages/` — static homepage and issue routes.
- `src/layouts/` — document shell and SEO metadata.
- `src/components/` — small static visual components.
- `schemas/issue-export.v1.schema.json` and `src/generated/` — authoritative
  schema and generated structural artifacts.
- `src/lib/issues.ts` — generated-schema loading, named presentation eligibility,
  URL policy, and ordering.
- `src/content/issues/` — local JSON exports; filename stem is the canonical
  route slug.
- `public/` — static deployment assets such as `CNAME`.
- `.github/workflows/` — GitHub Pages build and deployment.

## Style and implementation rules

- Match nearby TypeScript/Astro style: two-space indentation, no semicolons,
  single quotes, and explicit types for public helpers.
- Use semantic landmarks and external links with clear visual/text markers,
  `target="_blank"`, and `rel="noreferrer"` where appropriate.
- Keep generated schema validation exact; all schema fields are optional, and
  presentation eligibility separately skips incomplete entries. Keep URL policy
  explicit: resource URLs are absolute HTTP(S), Reddit URLs may be safe `/r/...`
  paths or Reddit absolute URLs, and unsafe relative paths are rejected.
- Keep CSS characteristic but restrained: no cards, rounded containers,
  shadows, gradients, horizontal overflow, or unnecessary animation. Preserve
  strong focus states and reduced-motion support.

## Verification

Do not claim completion without relevant checks. Prefer focused tests for schema,
URL selection, and issue ordering/latest/recent behavior, then run:

```text
pnpm install
pnpm test
pnpm check
pnpm build
```

Inspect generated HTML for no module/client scripts, no fake issue content, no
runtime remote font requests, and stable canonical URLs. Do not touch secrets.

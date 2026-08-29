---
name: issue-export-contract
description: Use when adding Riffle issue export JSON, refreshing the vendored Draft-04 schema, regenerating contract artifacts, or changing schema validation or presentation eligibility.
---

# Issue Export Contract

Keep the exported contract, generated validation, and presentation policy as
three explicit layers. Do not rediscover the contract from a build failure or
an example payload.

## Sources of truth

- `schemas/issue-export.v1.schema.json` is the vendored structural contract.
- `src/generated/` contains generated types and validator code. Never edit
  these files manually.
- `src/lib/issues.ts` contains separate presentation eligibility, URL policy,
  ordering, and filename-derived routing.
- `src/content/issues/*.json` contains authoritative published exports. Do not
  rewrite titles, Polish descriptions, ranking, or editorial decisions.

The Draft-04 schema intentionally permits optional fields. A schema-valid
object may still be ineligible for presentation. Do not silently strengthen
the generated schema validator to enforce presentation requirements.

## Add or update an issue

1. Put the unmodified export in `src/content/issues/<slug>.json`.
2. Treat the filename stem as the canonical route slug.
3. Run the generated validator through the normal tests/build.
4. Confirm the export is presentation-eligible. Ineligible schema-valid
   exports are skipped with a warning; schema-invalid exports fail.
5. Confirm URL behavior:
   - `resourceUrl` must be absolute HTTP(S) and is the primary destination.
   - `redditUrl` may be a safe `/r/...` path or an absolute Reddit URL.
   - Relative Reddit paths are normalized by presentation code, not by the
     structural validator.
6. Inspect the generated route and verify that original titles and
   descriptions are unchanged.

Never invent demo publication content to make a build pass.

## Presentation UX

- Treat exported `position` values as authoritative ranking positions. They may
  be sparse; never renumber them into a new contiguous ranking, and keep them
  out of the visible row when an unlabeled number would confuse the reader.
- Keep export order and all export data unchanged. `resourceUrl` is the primary
  title destination, but render explicit visible `resource ↗` and `discussion ↗`
  actions whenever those destinations exist. Keep discussion visible when
  `resourceUrl` is null.

## Refresh the schema

Require the upstream URL as explicit input; do not hard-code a local address:

```text
pnpm schema:fetch -- <http(s)-schema-url>
```

Alternatively set `RIFFLE_SCHEMA_URL`. The fetch command validates schema
identity and version before atomically replacing the vendored copy.

Then regenerate and check drift:

```text
pnpm schema:generate
pnpm schema:check
```

Review the vendored schema diff and every generated-artifact diff together.
Do not infer `required`, formats, ranges, or URL rules from observed exports.
If upstream semantics are insufficient, change the producer schema or keep a
clearly named presentation policy; do not create an accidental second schema.

Normal builds and deployment CI must not fetch the private upstream endpoint.
They use the committed schema and fail when generated artifacts drift.

## Change validation or eligibility

- Structural changes start in the upstream schema, followed by fetch and
  generation. Do not hand-write parallel TypeScript interfaces or structural
  validators.
- Eligibility changes belong in `src/lib/issues.ts` and require focused policy
  tests. Name them as eligibility or presentation behavior, not schema rules.
- Keep schema-validator tests aligned with exact optional, nullable, format,
  and `additionalProperties` semantics.
- Keep URL normalization tests separate because validation is non-transforming.
- Preserve descending `generatedAt` ordering and the latest/recent split unless
  product requirements explicitly change.

## Verification

Run:

```text
pnpm schema:check
pnpm test
pnpm check
pnpm build
```

For publication or contract changes, also inspect generated HTML for:

- the expected filename-derived issue route and canonical URL;
- unchanged exported text;
- correct resource and discussion destinations;
- no module/client scripts;
- no fake issue content or runtime remote-font requests.

Do not claim completion or remove the working spec until a real export passes
the full verification path.

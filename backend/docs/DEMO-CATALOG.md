# Full DEV demo catalogue

`scripts/seed-full-demo-catalog.cjs` adds **3 new demo listings to each active category**, including parent categories. The September 2026 catalogue contains 91 categories: 273 listings and 522 image records. Existing demo/product records are preserved and do not count toward this batch.

## Run

From `backend`, after `npm run build`:

```powershell
node --test scripts/demo-catalog-data.test.cjs
node scripts/seed-full-demo-catalog.cjs
node scripts/seed-full-demo-catalog.cjs --apply --project=brabreqaarmuowymfnkl
node scripts/seed-full-demo-catalog.cjs --verify
```

The default command is a read-only plan. `--apply` requires the matching Supabase project ref and refuses a mismatching database/Storage target or `NODE_ENV=production`. Credentials come from the existing backend `.env`; none are printed. No schema migration, app rebuild, pricing/plan changes, financial transactions, payments, or notification sends are performed.

## Applied DEV result — 2026-09-20

The batch was applied to `brabreqaarmuowymfnkl`: 273 listings across 91 categories, 522 gallery image records. Two opposite-order workers created 171 and 102 records respectively and skipped the other's committed records; both audits found exactly three per category. Six fixture tests passed. Local API checks confirmed complete phone attributes and hidden exact location/email in the public response. Browser checks confirmed loaded cover/gallery images, detail attributes and category/search filtering. The dedicated demo seller login was verified without logging session tokens.

Full Storage verification also passed: **522/522 images** were downloaded through signed URLs and checked for readable image signatures.

## Fixtures

- Batch/product slug prefix: `demo-catalog-v1-`. All titles start with `[DEMO]` and descriptions explicitly state that details, prices and contacts are fictional. Images illustrate a product or its category and are not a claim of exact model/condition. Non-matching representative photographs are disclosed in the title where appropriate and in all descriptions.
- Seller: `catalog-demo@example.invalid`, display name `Shop Demo Tất Tần Tật`. Initial DEV-only password defaults to `Demo@123` (optional `DEMO_CATALOG_PASSWORD` override on **first creation**). Existing account passwords and users are never reset. Use a different buyer account to test purchases; do not send real payments or call the non-routable demo phone `0000000000`.
- Curated Vietnamese category content in `scripts/demo-catalog-data.cjs`; all visible attributes, including optional attributes, are populated. Each listing has a versioned form snapshot, public snapshot, field rows, gallery/cover, price mode, condition, fictional contact and location with exact address/GPS hidden. Electric vehicle fixtures exercise conditional fields; rental fixtures exercise monthly/day pricing.
- `me-va-be` and `do-dien-tu` have no active inherited form. Two **inactive, snapshot-only demo templates** support their seeded listings without changing the active configuration or category tree.
- This is an administrative DEV data import, so it does not invoke user subscription listing caps. It does not grant an unlimited subscription or alter any pricing/wallet/ledger rows. The dedicated seller may exceed the regular free-plan cap; normal application limits still apply to subsequent new posts.

## Images and provenance

Product image references come from [DummyJSON's prototype product catalogue](https://dummyjson.com/docs/products); supplementary category photographs are fetched from `images.unsplash.com`. Each original source URL is recorded in the `DEMO_CATALOG_SEEDED` audit entry. Do not mistake these illustrative assets/specifications for real listings or approved commercial product claims.

The seeder checks HTTP success, image signatures and size, downloads each source once per run, and copies bytes to the existing private `listing-media` bucket under `demo-catalog-v1/<listing UUID>/...`. Every listing owns distinct storage keys. Public product images use the normal API redirect to signed media, so remote placeholder URLs are not required by Android or Web after seeding.

## Idempotency, verification and recovery

UUIDs and slugs are deterministic. Existing batch products are skipped, never overwritten or duplicated; user edits are preserved. Each new product, listing, field values, gallery, publication record and audit record commit together in one database transaction. Per-slug transaction locks serialize duplicate workers. Storage uses `upsert:false` and content-addressed keys; retries reuse existing objects rather than replacing them.

An optional second invocation with `--reverse` processes categories from the opposite end. It uses the same IDs and locks, so overlapping work cannot create extra listings. This is only a throughput option; it does not create another batch.

Uploads occur before DB commit. A crash/DB failure may leave unreferenced files **only inside the batch prefix**; rerunning the same seed recovers matching objects. The script deliberately performs no broad storage deletes or automatic destructive cleanup. No real data is removed.

Verification checks exactly three batch products per category, backend validation of every snapshot, all visible field values, cover/gallery counts and—under `--verify`—actual readability and image format of every private stored asset. `demo-catalog-data.test.cjs` tests UUID stability, every curated category, complete typed data, conditional visibility, rental prices and rejection of unknown categories. Newly added categories require explicit sample definitions; the script will not fill them with unrelated fallback merchandise.

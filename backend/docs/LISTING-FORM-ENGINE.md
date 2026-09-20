# Dynamic Listing Form — architecture

One API contract powers Web, Android and Admin. Category-specific code is restricted to **seed configuration**, never frontend screens.

`Category → versioned Template → typed Fields/Options → draft → media → validation → publish → existing Product`

Seven steps combine description with product information: category, information, media, price/location, contact, preview, confirmation. Form state survives back navigation; server drafts use optimistic revisions to prevent tab/device overwrites.

## Storage and compatibility

- Existing `categories`, `products`, `product_images` and financial flows remain in place.
- `listing_templates`, `listing_fields`, `listing_field_options` hold versioned configuration. Admin changes create a new template version; old drafts retain a schema snapshot.
- `listings` owns draft data, a published snapshot and a product projection. Editing a published listing does not expose unsaved draft data publicly.
- `listing_field_values` stores typed JSON values; `listing_images` and `listing_videos` register server-uploaded media, not arbitrary client URLs.
- `listing_publish_requests` implements actor-scoped idempotency. Publication, product projection and audit commit together under row locks.
- Prices cross the API as integer strings. Contact/free/rate-based listings cannot accidentally enter the fixed-price checkout flow.
- Exact address and GPS coordinates are removed from public snapshots when the seller chooses address privacy. Email remains private.
- New Supabase tables use RLS with no anonymous direct-write policy. REST endpoints enforce authentication, ownership, admin roles, strict validation and rate limits.

## Boundaries

No official geographic data was supplied. Location accepts province/district/ward text and explicit GPS consent. Android and Web now share an interactive map picker: click/drag a pin, select map center, or enter coordinates manually. Address autocomplete and official geographic selectors remain pending; selecting a pin does not reverse-geocode or validate the typed address.

The map uses locally bundled Leaflet 1.9.4 and the standard OpenStreetMap HTTPS raster tile service, with visible attribution, normal browser caching, no prefetch/offline downloads, Web Referer and an Android app User-Agent suffix. This is an initial low-traffic provider, not a production SLA: review [the OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and provision an appropriate tile provider before scaling. Only map viewport requests are sent to OSM; never pass auth tokens, listing IDs or contact/address text. Coordinates are limited to ±85° latitude for the Mercator map, ±180° longitude. The initial Quy Nhon viewport is **not** a chosen location until the seller explicitly selects a point.

Android loads the reviewed local assets under an HTTPS app-assets origin, denies other resources except the explicit OSM tile host, disables file/content access and mixed content, and exposes no JavaScript/native bridge. Native code reads/writes only validated coordinates. GPS permission is requested only after tapping the location button; manual selection works without location permission. Web frame messages require both the correct origin and the expected parent/child window.

Media storage must support a private `listing-media` bucket. Uploaded drafts are private; authorized owners use expiring preview URLs. Published detail endpoints issue read URLs for published media only. Images: JPEG/PNG/WebP, 10 MiB; videos: MP4/WebM, 50 MiB; limits 20/3. Magic-byte validation is mandatory. Client resizing/cropping is a convenience; server checks remain authoritative.

Never log access tokens, signed media URLs, exact addresses or contact details in audit summaries. Do not run APK packaging automatically.

## Delivery status (2026-09-20)

Implemented: additive PostgreSQL migration, 12 seeded category groups, inherited versioned templates, generic Web and Android renderers, seven-step wizards, authenticated drafts/autosave/resume, image resizing/center crop, image/video upload, ordering/cover, preview/publication, public Web specifications/gallery/contact, Admin version editor/category creation, Android/Web map pin selection and location privacy. Backend validators are reused directly by Web; Android mirrors UX checks while the server remains authoritative. No category-specific form is hard-coded in Android.

Not complete: official location selectors/address search, drag-to-crop and drag-and-drop ordering (buttons are available), expiry refresh for preview URLs in very long editing sessions, production media decoding/scanning/cleanup worker. Current byte signatures check formats but are not malware scanning or complete codec validation. Before production, add abandoned-draft retention and storage cleanup policies.

Android `sell` now opens the dynamic wizard. Editing an owned product resolves `/listings/by-product/:productId`: engine listings resume the pinned draft; legacy products keep their existing editor. A missing/unauthorized product is an error, never a fallback to the legacy editor. Serialized writes use revision checks; HTTP saves are not cancelled by further typing. Uploads are bounded before decoding, correct EXIF orientation, resize and optionally center-crop before stripping metadata into JPEG. Values and VND prices use the same API contract as Web. Successful autosave persists to the server; edits that could not be saved remain only in memory, so do not close the app until the saved confirmation appears.

Android product/home readers now resolve API-relative image URLs and render integer prices and CONTACT/FREE/hour/day/month/m² modes without floating-point conversion. `:app:compileDebugKotlin` passed; no APK packaging was run. Backend regression suite after the owner lookup addition: **65 tests passed**.

Verification for the Android/map extension: Android compilation and 11 unit tests (9 new listing tests), Web build/type-check and 12 Web/contract/map tests passed. Real PostgreSQL rollback integration passed, including product-to-listing ownership, precise coordinate persistence and public privacy. Browser checked map tile rendering, explicit pin confirmation and zoom. Android GPS permission dialogs, WebView and media handling still need device testing; no APK was packaged or installed. Earlier HTTP/private Storage smoke passed before this extension. Existing Web lint command remains unconfigured (no ESLint flat config).

## Setup and verification

From `backend`: `npm run build`, `node scripts/setup-listing-engine.cjs --apply`, `npm test -- --runInBand`, `node scripts/test-listing-engine-db.cjs`.

Setup is DEV-only, additive and idempotent. It preserves existing products and configured template versions. New draft media bucket is private. DB integration test uses a real transaction and rolls back every test record; it mocks storage and therefore does not verify a real file upload.

For a real local HTTP + private Storage smoke test: `node scripts/test-listing-engine-http.cjs --dev`. It uses the existing demo user (optional `DEMO_TEST_PASSWORD` override), tests a real image upload, signed read, anonymous denial, stale revision and admin RBAC, then deletes only its own private test draft/file. It never publishes a product.

From `web`: `npm run build`, `npm run test:ui`. Web runs on port 3001, API on port 3000. `/sell` is the wizard; `/admin/listing-templates` is configuration (backend enforces admin RBAC regardless of page visibility).

From the repository root: `./gradlew.bat :app:testDebugUnitTest` compiles and runs JVM tests without APK packaging. Shared map assets live in `shared/map-picker`; Android includes that asset directory, while Web `predev`/`prebuild` copies reviewed files into `public/map-picker`. The vendored Leaflet license must remain with these assets. Restart the backend after building the new owner lookup route; deploy it to the Android-configured API before using the new editor against a remote server. No remote deployment is performed automatically.

## REST contract

All paths below are relative to `/api/v1`; successful responses are `{ success: true, data, message: null, errorCode: null }`. Authentication uses Bearer access tokens. Money is an integer VND string, never a JS float.

| Method | Path | Access / purpose |
| --- | --- | --- |
| GET | `/listing-categories` | Active category tree, string IDs and parentId |
| GET | `/categories/:id` | Category metadata |
| GET | `/listing-templates/:categoryId` | Nearest active inherited template |
| GET | `/listing-fields/:templateId` | Active fields/options |
| POST | `/listings/draft` | Owner; `{ categoryId, clientKey: UUID }` |
| GET | `/listings/mine` | Owner's latest 100 draft/published summaries |
| GET | `/listings/by-product/:productId` | Authenticated owner lookup; `{ listingId: UUID \| null }`, null only for an owned legacy product |
| GET | `/listings/:id` | Owner's draft or public immutable snapshot |
| GET | `/listings/:id?view=published` | Published version, even for owner |
| PUT | `/listings/:id` | Owner; `{ revision, data }`; 409 on stale revision |
| POST | `/listings/:id/images` | Owner; multipart `file`, JPEG/PNG/WebP, 10 MiB |
| POST | `/listings/:id/videos` | Owner; multipart `file`, MP4/WebM, 50 MiB |
| DELETE | `/listings/:id/media/:mediaId` | Owner; only media not referenced by draft or live version |
| GET | `/listings/:id/media/:mediaId` | Published media only, redirect to expiring private-storage URL |
| POST | `/listings/:id/publish` | Owner; `{ revision }`, UUID `Idempotency-Key` header |
| POST | `/admin/listing-engine/categories` | Admin; `{ name, slug, parentId? }` |
| POST | `/admin/listing-engine/templates/:categoryId/versions` | Admin; `{ definition: { name, fields, config, reason } }` |

Field errors use `{ success:false, errorCode:'LISTING_VALIDATION', message, errors }`, keyed as `values.brand`, `contact.phone`, etc. Draft save returns the next `revision`. Persist the new revision before the next write. Publish returns `productId` for the existing product detail route.

File upload returns `{ id, kind, url }`; add the returned UUID to `data.images`/`data.videos`, then save. Image order defines cover/order. Owner GET includes unselected uploaded media to recover interrupted saves. A draft holds at most 20 images and 3 videos; registration allows 40/6 to replace media while retaining a live version. Unused uploads can be deleted explicitly.

Public reads omit email, hidden conditional fields, and precise address/GPS by default. Only `hideExact:false` opts in to precise location. Existing fixed-price order APIs reject CONTACT/FREE and rate-based listing modes. Legacy product-edit API does not bypass the engine for projected products.

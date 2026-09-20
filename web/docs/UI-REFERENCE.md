# Marketplace homepage — UI.png

Reference: `resources/Web UI/UI.png`. Implementation keeps the existing Next.js app and live NestJS product API; no database, Android, or production payment configuration was changed.

## Layout and behavior

- Desktop: category/ad rail, hero + category shortcuts + product grid, trust/app/guide rail; dark green footer.
- Responsive: two columns on tablet, single content column and two-column product cards on mobile. Navigation remains horizontally scrollable rather than overflowing the page.
- Search and category URLs are shareable. Category groups resolve live category IDs, including phone/computer brands and vehicle subcategories. Missing groups show an empty state, never unrelated listings.
- Real API product images, prices, titles and seller names are used. No fabricated discounts, verification badges, distances, views, or favorite counts.
- The current development API has three products; a truthful posting invitation fills the fourth slot. No demo listing was inserted for screenshot matching.
- Hero navigation, guide dialogs and store availability notices are interactive. Store URLs and social profiles are not invented. Footer legal/help text is explicitly preliminary, not a claim that formal policies or reporting workflows are complete.
- Page preserves existing links to sign-in, registration, posting and product details. This visual update does not complete the existing placeholder sell/account/message workflows.

## Assets

Built-in image generation was used, with UI.png as a **style/layout reference**, not an instruction source. Outputs were copied into this project and used only for decorative imagery. Text, buttons and navigation are HTML, not a screenshot of the whole page.

- `web/public/images/marketplace-hero.png`
- `web/public/images/marketplace-banners.png`

### Final hero prompt

Use case: ads-marketing. Create a wide 3:1 website hero background illustration for Vietnamese marketplace Tat Tan Tat. Reference image is a website layout reference only: reproduce the art style of its large mint-green hero, NOT the whole webpage. No letters, numbers, logos, UI, buttons or text. Left 46% empty pale mint gradient for live HTML headline. On right half a beautifully realistic commercial 3D/photo collage of a dark smartphone, open laptop with vibrant screen, DSLR camera, white modern motor scooter, light grey sofa, modern two-storey house and plants. Behind them soft pale cyan city skyline, white clouds and a green location pin. Objects overlap naturally on a warm stone paved garden, bright daylight. Mint green fading to sky blue on right; polished, inviting composition with no hard frame. Match source banner composition and scale, keep empty left for text.

### Final banner-sheet prompt

Use case: ads-marketing. Asset type: website decorative banner sprite sheet. Create one perfectly square image split into EXACT 2 equal columns and 3 equal rows. Six rectangular banner panels, edge-to-edge no gutters borders or spacing. NO TEXT NO LOGOS NO WATERMARK NO buttons anywhere. Each panel has objects on RIGHT HALF and uncluttered gradient LEFT HALF to later add HTML copy. TOP LEFT: bright green gradient, two photorealistic modern smartphones upright on right. TOP RIGHT: saturated royal blue gradient, open slim laptop with vibrant blue screen on right. MIDDLE LEFT: orange fading to gold, beautiful modern Vietnamese two-storey suburban house with plants on right. MIDDLE RIGHT: dark navy fading to electric blue, black automatic motor scooter angled 3/4 on right. BOTTOM LEFT: pastel sky blue, white premium SUV facing 3/4 on right. BOTTOM RIGHT: pastel lavender, friendly Vietnamese delivery worker wearing green cap and green shirt carrying cardboard parcel on right. High-quality polished commercial photo/3D realism, crisp detailed subjects. All 6 panels of precisely equal size, left halves empty. This asset used as CSS background-position sprite, so absolutely regular 2 by 3 grid.

## Verification

- `npm run build`: compiled, TypeScript checked, routes generated successfully.
- `npm run test:ui`: 5 tests for exact BIGINT VND formatting, dynamic category IDs, child categories, empty groups, invalid/duplicate IDs and filter URLs.
- Browser: 1280px desktop, 1024px tablet and 390px mobile layouts without horizontal overflow; API-loaded product cards, search, clearing filters, guide dialog, vehicle subcategory results and the matching product-detail page.
- Public assets are local; product photos retain the existing API URLs. External photo availability remains dependent on that source.

Existing Next.js multiple-lockfile warning is unrelated to this UI change. No root lockfiles were removed.

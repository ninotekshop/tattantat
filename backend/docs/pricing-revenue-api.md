# Pricing & Revenue API

All money fields are integer VND decimal strings. Authenticated write calls that
move money require `Authorization: Bearer <access-token>` and an
`Idempotency-Key` header. Client input never includes a platform fee, shipping
amount, payment fee, payout or ledger amount.

| Purpose | Endpoint | Access |
|---|---|---|
| Price preview | `GET /api/v1/pricing/order-preview?productId={uuid}` | Public |
| Create a reservation-backed COD order | `POST /api/v1/orders` | Buyer + idempotency key |
| Hide or republish own listing | `PATCH /api/v1/products/{id}/status` | Listing owner |
| Create COD intent | `POST /api/v1/payments` | Buyer + idempotency key |
| Read immutable order price | `GET /api/v1/orders/{id}/price` | Buyer or seller |
| Complete order / post order journal | `POST /api/v1/orders/{id}/complete` | Seller |
| Seller wallet / revenue / payout | `/api/v1/seller/wallet`, `/seller/revenue`, `/seller/payout` | Seller |
| Create promotion request | `POST /api/v1/promotions/purchase` | Seller + idempotency key |
| Settle promotion | `POST /api/v1/promotions/orders/{id}/settle` | Finance admin |
| Purchase subscription | `POST /api/v1/subscriptions/purchase` | Seller + idempotency key |
| Settle subscription | `POST /api/v1/subscriptions/orders/{id}/settle` | Finance admin |
| Create campaign | `POST /api/v1/advertising/campaigns` | Seller |
| Settle campaign | `POST /api/v1/advertising/campaigns/{id}/settle` | Finance admin |
| Settle shipping | `POST /api/v1/admin/orders/{id}/shipping/settle` | Finance admin + idempotency key |
| Pending shipping settlement | `GET /api/v1/admin/orders/shipping/pending?limit=100` | Finance admin |
| Release seller balance | `POST /api/v1/admin/orders/{id}/wallet/release` | Finance admin + idempotency key |
| Refund order | `POST /api/v1/orders/{id}/refund` | Seller or finance admin + idempotency key |
| Financial report | `GET /api/v1/admin/financial-report?from={ISO}&to={ISO}` | Finance admin |
| Refresh daily revenue projection | `POST /api/v1/admin/financial-report/refresh` | Finance admin |
| Read daily revenue projections | `GET /api/v1/admin/financial-report/daily?from={date}&to={date}` | Finance admin |
| Export CSV financial report | `GET /api/v1/admin/financial-report.csv?from={ISO}&to={ISO}` | Finance admin |
| Export Excel / PDF financial report | `GET /api/v1/admin/financial-report.xlsx` / `.pdf` | Finance admin |
| Reconciliation | `GET /api/v1/admin/reconciliation` | Finance admin |
| Financial audit log | `GET /api/v1/admin/financial-audit-logs?entityType={type}` | Finance admin |
| Ledger transaction list | `GET /api/v1/admin/transactions?page=1&limit=50&type={type}&orderId={uuid}` | Finance admin |
| Commercial settlement queue | `GET /api/v1/admin/commercial/queue?status=OPEN&limit=100` | Finance admin |
| Payout queue / transition | `GET /api/v1/admin/payouts?status=REQUESTED`, `POST /api/v1/admin/payouts/{id}/status` | Finance admin |
| Expire promotion activations | `POST /api/v1/admin/promotions/expire` | Finance admin |
| Manage pricing versions | `GET/POST /api/v1/admin/pricing-rules` | Finance admin |
| Create/manage promotion packages | `POST /api/v1/admin/promotion-packages`, `GET/POST /api/v1/admin/promotion-packages/{id}/versions` | Finance admin |
| Create/manage subscription plans | `POST /api/v1/admin/subscription-plans`, `GET/POST /api/v1/admin/subscription-plans/{id}/versions` | Finance admin |

`POST /payments` currently accepts `{ "orderId": "uuid", "method": "COD" }`.
An online provider must settle only through a signature-verified backend webhook;
there is deliberately no client endpoint that marks an online payment as paid.

`POST /orders` locks the product row and changes a successfully created order's
listing from `ACTIVE` to `RESERVED` in the same database transaction. Cancelling
the pending order restores `ACTIVE`; completing it changes the listing to `SOLD`.
`PATCH /products/{id}/status` accepts only `{ "status": "HIDDEN" }` or
`{ "status": "ACTIVE" }`, and never changes a reserved or sold listing.

For shipping settlement, send `{ "providerCost": "32000" }`. The system reads
the order's immutable customer shipping snapshot, stores the provider cost and
posts the margin separately.

Promotion expiration is run automatically every 15 minutes by default. The
current and previous daily revenue projections are also refreshed hourly. Set
`FINANCIAL_MAINTENANCE_ENABLED=false` only for one-off jobs; an advisory lock
makes concurrent API instances safe.

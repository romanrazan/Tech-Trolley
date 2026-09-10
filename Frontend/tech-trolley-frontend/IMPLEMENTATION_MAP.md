# Tech Trolley implementation map

This map was completed from the actual NestJS controllers, DTOs, entities, services, design files, lecture examples, and `PROJECT_ANALYSIS_TRACKER.md` before frontend implementation.

## Role and screen map

| Screen                | Owner                        | Manager                      | Salesperson                                    | Backend source                                            |
| --------------------- | ---------------------------- | ---------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| Dashboard             | Full business totals         | Full business totals         | Personal sales view composed from allowed APIs | Reports, inventory, sales, customers                      |
| Sales                 | Create, list, view, payments | Create, list, view, payments | Create, list, view                             | `/sales`, `/sales/:id`, `/sales/:id/payments`             |
| Purchases             | Full                         | Full                         | Hidden and route-blocked                       | `/purchases`, `/purchases/:id`, `/purchases/:id/payments` |
| Inventory             | Read and IMEI lookup         | Read and IMEI lookup         | Read and IMEI lookup                           | `/inventory/stock`, `/inventory/imeis/:imei`              |
| Products and variants | Manage                       | Manage                       | Read                                           | `/products*`                                              |
| Brands and categories | Manage                       | Manage                       | Read                                           | `/brands*`, `/categories*`                                |
| Customers and dues    | Manage                       | Manage                       | Manage                                         | `/customers*`                                             |
| Suppliers and dues    | Manage                       | Manage                       | Read                                           | `/suppliers*`                                             |
| Accounts              | Create, read, edit, delete   | Create and read              | Hidden and route-blocked                       | `/accounts*`                                              |
| Expenses              | Manage                       | Manage                       | Hidden and route-blocked                       | `/expenses*`                                              |
| Reports               | Read                         | Read                         | Hidden and route-blocked                       | `/reports/dashboard`, `/reports/sales-chart`              |
| Team                  | Manage                       | Read                         | Hidden and route-blocked                       | `/users*`                                                 |
| Shop settings         | Read and update              | Read                         | Hidden                                         | `/shop`                                                   |
| My account            | Verified read-only profile   | Verified read-only profile   | Verified read-only profile                     | `/auth/me`                                                |

## Important data flows

1. Login stores the bearer token, then `/auth/me` verifies and hydrates the user before protected UI appears.
2. Purchase creation sends items to `/purchases`; the backend calculates the total and receives inventory in its transaction.
3. Serialized purchase items require exactly one unique IMEI per unit in the frontend before the backend receives them.
4. Sale creation checks each supplied IMEI through the backend, sends the sale to `/sales`, and relies on the backend transaction to issue stock.
5. Purchase payments call `/purchases/:id/payments`; the backend saves the payment and debits the account atomically.
6. Sale payments call `/sales/:id/payments`; the backend saves the payment and credits the account atomically.
7. Expense create, update, and delete calls rely on backend account rebalancing and refresh both the page's persisted expense data and totals.
8. Customer and supplier due values come from their dedicated backend-calculated endpoints.
9. Product list labels are composed by joining the backend's scalar brand/category IDs with their public lists. `/products/[id]` is an App Router dynamic route that loads the selected product and its supported variant endpoint.

## Deliberately omitted or read-only behavior

- No fake return, cancellation, stock-history, low-stock, investment, refresh-token, or profile-update behavior was invented because the backend has no such endpoints.
- Product variants can be created and read. They cannot be edited or deleted because the backend does not expose those mutations.
- Shop settings display a clear error if the backend database has no singleton shop row; the frontend does not invent or seed backend data.
- Dashboard values remain backend-derived. The salesperson dashboard filters the backend's allowed sales list by the verified user's ID.

## Backend changes

None. All implemented workflows use the existing API contracts and authorization guards.

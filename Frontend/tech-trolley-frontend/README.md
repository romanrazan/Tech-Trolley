# Tech Trolley frontend

Responsive Next.js App Router frontend for the existing Tech Trolley NestJS API. The interface follows the supplied Tech Trolley design and supports the backend's owner, manager, and salesperson workflows.

## Stack

- Next.js 16 App Router, React 19, and strict TypeScript
- Tailwind CSS 4
- Axios API client
- Zod and React Hook Form
- Recharts and Lucide icons
- Sonner feedback messages

## Run locally

1. Start PostgreSQL and configure the backend `.env` file.
2. Start the backend from `Backend\Tech_Trolley_Final\Tech_Trolley_Final`:

   ```bash
   npm run start:dev
   ```

3. Copy `.env.example` to `.env.local` if the backend is not at the default URL.
4. Start this frontend:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3001`. The backend API defaults to `http://localhost:3000`.

The browser-visible API URL is configured with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Authentication

Login uses `POST /auth/login`, stores the returned bearer token in local storage when “Remember me” is selected (otherwise session storage), and immediately verifies it through `GET /auth/me`. Every protected request receives the bearer token through the central Axios interceptor. Any `401` clears both token stores and returns the user to `/login`. Logout calls `POST /auth/logout` and clears the frontend session.

The backend remains the security authority. Navigation and actions are also filtered for `OWNER`, `MANAGER`, and `SALESPERSON` to avoid presenting unsupported controls.

## Available pages

- `/login` and `/register`
- `/dashboard` with role-specific totals, charts, inventory and recent activity
- `/sales` with sale creation, serialized IMEI validation, details and authorized payments
- `/purchases` with stock-receiving purchases, details and supplier payments
- `/inventory` with aggregate status and IMEI lookup
- `/products` plus `/products/[id]` dynamic product and variant details
- `/brands`, `/categories`, `/customers`, and `/suppliers`
- `/accounts` and `/expenses`
- `/reports`, `/team`, `/settings`, and `/profile`

## API modules

Domain services under `src/services` use the existing endpoints:

- Auth: `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/me`
- Users: `/users`, `/users/:id`, `/users/:id/status`
- Shop: `/shop`
- Brands and categories: `/brands`, `/categories`
- Products and variants: `/products`, `/products/:id`, `/products/:id/status`, `/products/:id/variants`
- Customers and dues: `/customers`, `/customers/:id`, `/customers/:id/dues`
- Suppliers and dues: `/suppliers`, `/suppliers/:id`, `/suppliers/:id/dues`
- Purchases and payments: `/purchases`, `/purchases/:id`, `/purchases/:id/payments`
- Sales and payments: `/sales`, `/sales/:id`, `/sales/:id/payments`
- Inventory: `/inventory/stock`, `/inventory/imeis/:imei`
- Accounts and expenses: `/accounts`, `/accounts/:id`, `/expenses`, `/expenses/:id`
- Reports: `/reports/dashboard`, `/reports/sales-chart`

## Validation and checks

Run the full project checks with:

```bash
npm run typecheck
npm run lint
npm run build
```

All mutations refresh their affected server-backed lists after success. No mock business records are used. The current implementation required no backend source changes.

See [IMPLEMENTATION_MAP.md](./IMPLEMENTATION_MAP.md) for the screen, endpoint, and permission map.

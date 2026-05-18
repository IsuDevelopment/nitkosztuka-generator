---
description: "Clients module — managing customer records and their order history."
applyTo: "server/api/clients/**,pages/clients/**,components/client/**"
---

# Clients Module

## Purpose
Client records store customer contact info and default shipping address. Clients are referenced by orders. Each client has an order history.

## Files
| File | Purpose |
|------|---------|
| `server/api/clients/index.get.ts` | List clients with search, pagination |
| `server/api/clients/index.post.ts` | Create client |
| `server/api/clients/[id].get.ts` | Client detail + their orders |
| `server/api/clients/[id].put.ts` | Update client |
| `pages/clients/index.vue` | Client list with search |
| `pages/clients/[id].vue` | Client detail, edit button, order history table |
| `components/client/ClientFormDialog.vue` | Create/edit dialog (shared between pages) |
| `components/client/ClientSelect.vue` | AutoComplete with inline "Add" action |

## Data Model
```
Client {
  id, firstName, lastName, email?, phone?, defaultAddress?, notes?,
  createdAt, updatedAt, createdById
}
```

## Key Behaviors

### ClientSelect (AutoComplete)
Used in `pages/orders/new.vue`. Provides:
- Search-as-you-type against `/api/clients?search=...`
- Footer button "Dodaj klienta" opens `ClientFormDialog`
- On selection: emits `client-selected` with full client object
- Parent pre-fills `deliveryDetails` from `client.defaultAddress`

### ClientFormDialog
- Props: `visible: boolean`, `editClient?: ClientRecord | null`
- Emits: `update:visible`, `saved` (with created/updated client)
- Used for both create (no `editClient`) and edit (pass existing record)

## Rules
- Clients cannot be deleted if they have orders (FK RESTRICT).
- `defaultAddress` is a suggestion — user can override per order.
- Client list searches by `firstName`, `lastName`, `email`, `phone` (case-insensitive).

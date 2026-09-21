# Freightline TMS

## Category:
SaaS (multi-tenant B2B web application — transportation / delivery management system)

## Role:
Full-stack developer — architecture, backend, and frontend

## Stack:
Next.js 16 (App Router) · React 19 · TypeScript · Express 5 · Supabase (PostgreSQL, Storage, Row-Level Security) · Stripe · Redis (Upstash) + BullMQ · WebSocket · TanStack Query & Table · Zustand · Zod · React Hook Form · Tailwind CSS v4 · shadcn/ui + Radix UI · Recharts · Mapbox GL · PDFKit · Typesense

---

## Overview
A cloud platform that runs the full operations of a freight/delivery business — booking, dispatch, live shipment tracking, quotations, invoicing, and customer management — from a single multi-tenant codebase. Each shipping company gets an isolated workspace where it onboards its own employees with scoped logins; an internal admin console oversees every tenant, assigns work across companies, and configures roles, pricing, statuses, and templates without a code deploy. Separate corporate and residential customer portals let end customers track their shipments, manage their account through a sales pipeline, and (residential) earn and redeem loyalty points.

## Architecture
- **Multi-tenancy & isolation:** Admin → Shipping Company → Employee hierarchy with three route-group-scoped workspaces (admin / corporate / residential); PostgreSQL Row-Level Security enforces per-company and per-employee data isolation at the database layer, backed by a JWT that carries the user's role plus an "all vs. own/assigned" permission scope so a role like Driver only ever sees its assigned deliveries, quotations, and invoices.
- **Layered backend:** 24 feature modules, each split into route → controller → service → repository → Zod schema over Express 5, behind a middleware chain (auth → role → rate-limit → request-logger → timeout → error); ~80 versioned SQL migrations push money- and retention-critical logic into Postgres functions and `pg_cron` jobs (rewards-redemption caps, 90-day purge of abandoned accounts, notification enum sync, immutable tracking-event triggers).
- **State & data:** TanStack Query for server-state caching and optimistic updates, Zustand for auth/session/UI stores, WebSocket push for live dashboard and tracking updates, Redis + BullMQ for queued email dispatch and hot-path rate limiting, Typesense for full-text search across shipments and documents.

## Key modules
- **Deliveries:** company-scoped shipment list with configurable status machine (received → confirmed → assigned → picked up → in transit → out for delivery → delivered, plus cancellation and ETA/delay changes), multi-employee assignment via a dedicated join table, and color-coded status badges throughout.
- **Live tracking & map:** append-only, tamper-proof event timeline per shipment (city reached, status change, who logged it, when) with a Mapbox GL map pinning the current location and an inline "add a new city" flow against a shared master list.
- **Quotations & invoices:** create, edit, duplicate, and export to PDF (PDFKit); standalone or linked to a delivery; status lifecycle (draft → sent → accepted → paid → overdue); Terms & Conditions must be actively accepted before approval, creating an auditable agreement record; Stripe-backed invoice payment.
- **Pricing:** editable delivery rates, additional charges, service levels, and customer tiers that feed quotation and invoice generation.
- **RBAC & staff:** four internal roles (CEO, VP, Manager, Assistant) with the CEO as super-admin over custom roles; permissions toggled from a settings UI and encoded into the JWT, with every button, menu item, and route rendering conditionally against the current permission set; admin-side employee management with password reset.
- **Accounts & CRM pipeline:** 7-stage corporate sales pipeline (prospect → … → active → lost) on company accounts, with portal login access derived from pipeline stage via a sync routine, an account-activity feed, and dual human-readable IDs (`REQ-…` / `LLC-CORP-…`).
- **Residential rewards:** points program where residential customers earn points and redeem them against quotations, capped at 50% of quote value; admins can inspect any customer's balance and full ledger.
- **Notifications:** rule-driven engine fanning lifecycle events out to every stakeholder — customer and assigned driver/employee — over templated email (pluggable dispatcher) and in-app alerts grouped into tabs (All, Unread, Deliveries, Invoices, Quotes, Account) with unread counts and bulk actions.
- **Support & contact:** company-opened support cases with two-sided comments and attachments and staff re-status/close; a public contact form backed by a `contact_messages` table and an admin inbox.
- **Branding & theming:** per-company logo and per-user avatar upload with a crop dialog, surfaced across dashboards, tables, and PDF documents; user-customizable sidebar/content/accent colors persisted per user and applied as CSS-variable overrides.
- **Profiles & lifecycle:** soft-delete and edit for employee and customer profiles; deactivating an account cascades a soft-delete to its profiles, with every query filtering `deleted_at`.

## Highlights
Designed a permission-first architecture where every module is gated by dynamic RBAC from day one, so new features inherit access control instead of bolting it on later.
Built the shipment history as an append-only event log enforced by database triggers, making the delivery timeline a trustworthy audit record that cannot be silently edited.
Modeled portal access as a computed consequence of the corporate sales pipeline stage, removing an entire manual approve/reject workflow.
Kept tenant isolation enforced at the database via Row-Level Security rather than trusting application code.

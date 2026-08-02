# Logical Links — What's In The App

Logical Links is an online platform for managing shipping and deliveries. Three kinds of people use it: **Logical Links staff (Admin side)**, **Shipping Companies** who book and manage their own loads, and the **employees** those shipping companies hire.

## Logging In & Accounts

- Everyone logs in with an email and password, and stays signed in without being kicked out every few minutes.
- Registering creates a Shipping Company account — that person becomes the company's admin.
- A company admin can invite their own employees, who get their own logins with limited access.
- Profile pictures can be uploaded and cropped for every user, so people are easy to recognize throughout the app.

## Loads / Shipments

- Company admins see every load that belongs to their company. Employees only see the loads that have been assigned to them.
- Logical Links staff can see and manage every load across every shipping company, assign loads to companies, hand loads to specific employees, and update their status (booked, in transit, delivered, etc.).
- A searchable list of loads shows key details at a glance, with each load's status shown as a colored badge (different colors for different statuses, so you can tell what's happening without reading the text).

## Live Tracking, History & Map

- Every load has a running **history/timeline** — a permanent, step-by-step record of everything that's happened to it (city reached, status changed, who logged it, when). Nothing in this history can be erased, so it's a reliable record of the whole journey.
- There's an actual **map view** showing the load's current or most recent location, similar to tracking a courier package — pins the city on a real map instead of just listing it as text.
- Cities and provinces are tracked from a shared list, and new cities can be added on the fly while logging an update.
- Both shipping companies (and their employees) and Logical Links staff can see this tracking information for the loads they have access to.

## Quotations & Invoices

- Shipping companies can request price quotations and receive invoices, either tied to a specific load or as standalone documents.
- Documents can be created, edited, duplicated, downloaded as PDF, and tracked by status (draft, sent, accepted, paid, overdue, etc.) — again shown with color-coded badges.
- Before accepting a quotation, the shipping company is shown a Terms & Conditions summary and must actively accept it — this creates a record that the terms were agreed to.
- Company admins see all their company's documents; employees only see documents tied to loads assigned to them.
- The dashboard shows a running summary — how many quotations/invoices exist and how many are in each status.

## Alerts / Notifications

- A bell-style Alerts page notifies users about things that need attention — delivery updates, invoice/quotation activity, and account-related events.
- Alerts are grouped into tabs (All, Unread, Deliveries, Invoices, Quotes, Account) so people can filter to what matters to them.
- Users can mark individual alerts as read or clear everything at once, and unread alerts are counted so nothing gets missed.

## Support

- Shipping companies can open support tickets/cases when they have an issue.
- Logical Links staff can reply, change the case's status, or close it. Attachments and comments can be added by both sides on a case.

## Logical Links Staff Roles & Permissions

- Internal Logical Links staff are split into four roles: **CEO, VP, Manager, and Assistant.**
- The CEO can open a settings page and turn specific permissions on or off for each role — for example, who can create loads, edit invoices, manage other staff, or approve new shipping companies — without needing a developer to change anything.
- Every button, menu, and page in the Admin side automatically shows or hides itself based on what that staff member is allowed to do. Someone without permission to delete an invoice simply won't see a delete button at all.
- Staff can approve or reject new shipping companies trying to join the platform, manage the master list of cities used for tracking, and oversee all loads, documents, and support tickets.

## Company Branding

- Every shipping company can upload its own logo, which then appears across the app — on their dashboard, in tables, and on their quotations/invoices — so it's easy to see at a glance which company a load or document belongs to.

## Look & Feel

- Both the Admin side and the Shipping Company side share the same clean, dark navy sidebar with a warm gold accent color, so the app feels consistent no matter who's using it.
- Statuses everywhere (loads, tracking events, quotations, invoices, support cases) use color-coded badges rather than plain text, so it's quick to scan a list and understand what state things are in.

---
*This document describes what the application currently does, written in plain language for a general audience. Some recently built features (like the staff roles/permissions system) may still need a final setup step before they're fully live.*

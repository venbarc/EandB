# MediFlow — Eligibility & Benefits Dashboard

A healthcare eligibility tracking and appointment management system built with **Laravel 12**, **Inertia.js v2**, **React 19**, and **Tailwind CSS v4**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP 8.5.1) |
| Frontend Bridge | Inertia.js v2 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Bundler | Vite v7 |
| Icons | lucide-react |

---

## Features

- **Dashboard** — Paginated appointments table (20 per page) with expandable row details showing patient, insurance, eligibility, and financial data
- **Statistics** — 6 live KPI cards: Total Appointments, Eligibility Completed, Payments Completed, Total Amount, Total Collections, Total Unpaid
- **Filtering** — Multi-field filters: date, patient name, insurance (multi-select), location, provider, appointment status, auth required, referral required
- **Record Update** — 3-step modal workflow: Eligibility → Collect → Receipt confirmation
- **PSC Code Update** — Quick modal to assign Provider Service Center codes and descriptions
- **Export** — Export all appointments or Availity-specific export
- **Import** — Import appointments from Excel/CSV via Availity import

---

## Project Structure

```
├── app/
│   └── Http/
│       └── Controllers/
│           ├── DashboardController.php   # Main dashboard with filters & stats
│           └── AppointmentController.php # Import, export, update endpoints
├── resources/
│   ├── css/
│   │   └── app.css                       # Tailwind v4 theme (brand teal colors)
│   ├── js/
│   │   ├── app.tsx                       # Inertia entry point
│   │   ├── types.ts                      # TypeScript interfaces
│   │   ├── data.ts                       # Mock data generators
│   │   ├── Pages/
│   │   │   └── Dashboard.tsx             # Main dashboard page
│   │   └── Components/
│   │       ├── Header.tsx                # Nav, export/import controls
│   │       ├── StatsSection.tsx          # KPI cards + status legend
│   │       ├── Filters.tsx               # Filter bar
│   │       ├── AppointmentsTable.tsx     # Table with expandable rows
│   │       └── Modals.tsx                # UpdateRecord + UpdatePSC modals
│   └── views/
│       └── app.blade.php                 # Root Inertia template
├── routes/
│   └── web.php
├── vite.config.ts
└── package.json
```

---

## Routes

| Method | URI | Action |
|---|---|---|
| `GET` | `/` | `DashboardController@index` |
| `POST` | `/appointments/import` | `AppointmentController@import` |
| `GET` | `/appointments/export` | `AppointmentController@exportAll` |
| `GET` | `/appointments/export/availity` | `AppointmentController@exportAvailty` |
| `PATCH` | `/appointments/{appointment}` | `AppointmentController@update` |
| `PATCH` | `/appointments/{appointment}/psc` | `AppointmentController@updatePsc` |

---

## Setup

### Prerequisites

- PHP 8.5+
- Composer
- Node.js 20+

### Install

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

### Development

> **Windows note:** The `&` in the directory name `Eligibility&Benefits` breaks CMD shell parsing. The `package.json` scripts invoke Vite directly to work around this. Use the commands below as-is.

```bash
# Start Vite dev server
npm run dev

# Serve Laravel
php artisan serve
```

### Production Build

```bash
npm run build
```

---

## Styling

Tailwind CSS v4 — no `tailwind.config.js`. All theme configuration lives in [resources/css/app.css](resources/css/app.css):

```css
@import 'tailwindcss';

@theme {
  --color-brand-50:  ...;
  --color-brand-100: ...;
  --color-brand-600: #0d9488;  /* primary teal */
  --color-brand-700: #0f766e;
}
```

The `@` path alias resolves to `resources/js/` in both `vite.config.ts` and `tsconfig.json`.

---

## License

Private — internal use only.

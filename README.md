<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-brightgreen?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/react-18.2-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/supabase-backend-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/deployed-vercel-black?style=flat-square&logo=vercel" alt="Vercel" />
</p>

# PromptVault

**Your Personal Prompt OS — Store, Organize, Reuse, Share, and Monetize AI Prompts.**

PromptVault is a modern prompt management platform built for power users, creators, and teams. It starts as a personal tool and scales toward a full creator platform and marketplace. Store your best prompts, organize them with tags and collections, share curated vaults publicly, and eventually monetize your prompt expertise.

---

## ✨ What It Does

- 📝 **Create & Store** — Write, save, and edit prompts with a clean, distraction-free interface
- 📋 **Instant Copy** — Click any prompt block to copy it to your clipboard instantly
- 🔍 **Search & Filter** — Find prompts by name or content in real time
- 🔗 **Share Vaults** — Share your entire prompt collection via a personal link (`/vault/:id`)
- 🌐 **Public Vaults** — Publish a curated set of public prompts under your username (`/public/:username`)
- 👤 **Profile & Identity** — Unique username, avatar, full name, and plan-driven profile page
- 🔒 **Plan-Based Access Control** — Features are gated by plan level at both the UI and database layer

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS + Radix UI primitives |
| **Backend** | Supabase (Auth + PostgreSQL + RLS) |
| **State** | React Context + TanStack React Query |
| **Routing** | React Router v6 |
| **Deployment** | Vercel (SPA rewrites configured) |

---

## 🏗️ Architecture

```
src/
├── pages/              # Route-level page components
│   ├── Landing.jsx      # Dashboard — personal prompt grid
│   ├── Auth.jsx         # Login / Signup (Email + Google)
│   ├── Admin.jsx        # Prompt CRUD management
│   ├── Profile.jsx      # User profile + settings
│   ├── SharedVault.jsx  # Private shared vault view
│   ├── PublicVault.jsx  # Public-facing prompt vault
│   ├── CompleteProfile  # Post-OAuth username setup
│   └── Verified.jsx     # Email verification landing
│
├── lib/
│   ├── AuthContext.jsx  # Auth state provider (Supabase listener)
│   ├── supabase.js      # Supabase client initialization
│   ├── plans.js         # Plan hierarchy + feature gating engine
│   └── query-client.js  # TanStack Query instance
│
├── services/
│   ├── authService.js   # Auth operations (login, signup, profile sync)
│   ├── promptService.js # Prompt CRUD, search, vault operations
│   └── storageService.js# Local storage abstraction
│
├── hooks/
│   ├── usePlan.js       # Plan permission hook (pre-bound to user)
│   └── use-mobile.jsx   # Responsive breakpoint hook
│
├── components/
│   ├── PromptCard.jsx   # Prompt display card with copy + delete
│   ├── CornerNav.jsx    # Minimal navigation component
│   ├── EmptyState.jsx   # Empty state placeholder
│   └── ui/              # Radix-based UI primitives
│
├── config/
│   └── featureFlags.js  # Runtime feature toggles
│
└── App.jsx              # Root router + ErrorBoundary + providers
```

---

## 🔐 Authentication System

PromptVault uses Supabase Auth with two providers:

- **Email + Password** — Standard signup with email verification
- **Google OAuth** — One-click login with automatic profile creation

The auth flow is fully event-driven via `supabase.auth.onAuthStateChange`, ensuring instant UI updates without page refreshes. Key design decisions:

- **Single source of truth** — `AuthContext` is the sole owner of auth state
- **Non-blocking profile sync** — Profile resolution happens in the background after login
- **Plan-aware routing** — Google users missing a username are routed to `/complete-profile`

---

## 💳 Plan System

The plan system follows a **feature-first architecture**. Access control is defined in a single file (`plans.js`) and consumed everywhere via the `usePlan()` hook.

| Plan | Level | Focus | Prompt Limit |
|---|---|---|---|
| **FREE** | 0 | Basic usage | 25 |
| **PLUS** | 1 | Productivity | 300 |
| **CREATOR** | 2 | Identity & public presence | 300 |
| **CREATOR+** | 3 | Full power | 1,000 |

**Feature gating pattern:**
```js
const { canShareVault, canMakePromptPublic } = usePlan();

{canShareVault && <ShareButton />}
```

Backend enforcement is handled via Supabase Row Level Security (RLS) policies, preventing API-level bypass of plan restrictions.

---

## 🚀 Production Status

The following systems are fully built and deployed:

- ✅ Auth system (Email + Google + profile sync)
- ✅ Prompt CRUD (create, edit, delete via Supabase)
- ✅ Personal dashboard with search and filtering
- ✅ Shared Vault (`/vault/:id`) — private prompt sharing
- ✅ Public Vault (`/public/:username`) — public-facing curated prompts
- ✅ Profile page with username, avatar, and plan display
- ✅ Plan hierarchy engine with `hasFeature()` gating
- ✅ `usePlan()` hook for UI-level permission checks
- ✅ Delete confirmation modal with undo support
- ✅ Loading skeletons and success animations
- ✅ Vercel deployment with SPA rewrites
- ✅ Error boundary for crash recovery
- ✅ Email verification flow

---

## 🗺️ Upcoming Features

> The following features are planned and will be shipped incrementally.

### ⭐ Pin System
Highlight your most important prompts. Pinned prompts appear first in your vault. Plan-gated — free users see the option but are prompted to upgrade.

### 📊 Prompt Limit Enforcement
Hard limits per plan tier. Creation is blocked when the limit is reached, with a visible usage counter in the UI.

### 📈 Usage Counter
Track how many times you've used each prompt (personal use only — shared/public usage is excluded). Helps identify your most valuable prompts.

### 🏷️ Tags System
Tag prompts with custom labels. Filter your vault by tags for faster access. Basic tagging for all plans, advanced multi-filter and suggestions for higher tiers.

### 🔒 Upgrade Popup System
A reusable, context-aware modal that triggers when users interact with locked features. Dynamic messaging based on the feature and the user's current plan.

### 📁 Collections (Folders)
Organize prompts into named collections. Assign prompts to one or more collections. Filter the dashboard by collection.

### 📥 Add to Vault
Save prompts from public vaults into your personal vault with one click. Includes duplicate detection, multi-select, and auth-redirect-return flow for unauthenticated users.

### 🖼️ Image Prompts
Support for image-based prompts with upload and preview. Prompt cards display image thumbnails alongside text content.

### 🔗 Folder Sharing
Share entire collections publicly. Includes both free (open access) and paid (payment required, permanent unlock) folder types.

### 💰 Paid Folders & Monetization
Creators can set prices on collections. Purchases are tracked in a `user_purchases` table. Platform takes a percentage cut.

### 🛍️ Prompt Marketplace
Browse and discover prompts from other creators. Featured creators, trending prompts, and category-based discovery.

### 👥 Follow System
Follow your favorite creators and see their latest prompts in a personalized feed.

### 💸 Creator Earnings
Dashboard for creators to track purchases, revenue, and payouts.

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with Auth and a `profiles` + `prompts` table

### Setup

```bash
# Clone the repository
git clone https://github.com/ujjwal-fsl/promptvault.git
cd promptvault

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
```

Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

The project is configured for Vercel. Push to `main` to trigger automatic deployment.

---

## 📁 Database Schema

### `profiles`
| Column | Type | Description |
|---|---|---|
| `id` | uuid | User ID (from Supabase Auth) |
| `email` | text | User email |
| `username` | text | Unique username |
| `full_name` | text | Display name |
| `avatar_url` | text | Profile picture URL |
| `plan` | text | Current plan (FREE/PLUS/CREATOR/CREATOR_PLUS) |
| `created_at` | timestamp | Account creation date |

### `prompts`
| Column | Type | Description |
|---|---|---|
| `id` | uuid | Prompt ID |
| `name` | text | Prompt title |
| `body` | text | Prompt content |
| `tags` | text[] | Array of tags |
| `is_public` | boolean | Public visibility flag |
| `created_by` | uuid | Owner user ID |
| `usage_count` | integer | Personal usage counter |
| `source_prompt_id` | uuid | Original prompt (for vault copies) |
| `attribution_username` | text | Original creator username |
| `created_at` | timestamp | Creation date |

---

## 🧠 Design Principles

- **Show, don't hide** — Locked features are visible with upgrade prompts, not hidden
- **Systems, not features** — Every addition is a composable system (plans, permissions, vaults)
- **Monetize after value** — The free tier is generous; paid plans unlock power, not basic utility
- **Security at every layer** — RLS policies enforce rules server-side, not just in the UI

---

## 📄 License

This project is private and not open-sourced for public use.

---

<p align="center">
  <sub>Built by <a href="https://github.com/ujjwal-fsl">@ujjwal-fsl</a></sub>
</p>

# Foundly — Co-Founder Matching App

> A mobile app for startup founders to find their perfect co-founder — like Tinder, but for building companies.

---

## Overview

Foundly connects entrepreneurs by matching them on complementary skills, shared interests, startup stage, and location. Founders swipe on profiles, discover startup ideas, and chat in real time when they match.

## Features

- **Swipe-based matching** — swipe right to connect, left to skip. Mutual right swipes create a match
- **Real-time chat** — instant messaging with read receipts, image sharing, and date separators
- **Startup Ideas tab** — post ideas, discover them with category/sort filters, express interest to auto-match with founders
- **Compatibility scoring** — algorithm factors in role complementarity, skill gaps, shared interests, experience level, and location
- **Daily swipe limit** — freemium model (10 swipes/day free) with Pro paywall UI
- **Who Liked You** — see profiles that swiped right on you
- **Activity feed** — in-app notifications for new matches, messages, and idea interests
- **Profile completeness nudge** — progress bar with matching impact per missing field
- **Google Sign-In** — OAuth via Supabase
- **Block / Report / Unmatch** — full moderation toolset
- **Settings** — discoverable toggle, account deletion, privacy controls
- **Filter & search** — filter founders by role/skills, ideas by category; sort by newest or most interested

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React Native + Expo SDK 54 | Cross-platform mobile (iOS & Android) |
| TypeScript | Type safety |
| Expo Router v6 | File-based navigation |
| Supabase JS | Real-time chat subscriptions |
| expo-linear-gradient | UI gradients |
| react-native-reanimated | Swipe gesture animations |
| AsyncStorage | Local session persistence |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API |
| Supabase | PostgreSQL database + Auth + Storage + Realtime |
| Render | Cloud deployment |

### Infrastructure
| Service | Purpose |
|---|---|
| Supabase Auth | JWT authentication + Google OAuth |
| Supabase Storage | Avatar photos + chat images |
| Supabase Realtime | WebSocket chat subscriptions |
| EAS Build | Android APK / iOS IPA builds |

## Architecture

```
┌─────────────────┐     REST API      ┌─────────────────┐
│  React Native   │ ◄────────────────► │   FastAPI       │
│  (Expo Router)  │                    │   (Render)      │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ Realtime WebSocket                   │ Service Role
         │                                      ▼
         └──────────────────────────► ┌─────────────────┐
                                      │    Supabase     │
                                      │  PostgreSQL +   │
                                      │  Auth + Storage │
                                      └─────────────────┘
```

## Key Technical Decisions

- **RPC functions over supabase-py filters** — supabase-py chained `.eq()` filters fail silently; all critical queries use PostgreSQL RPC functions for reliability
- **Ref-based swipe limit** — React state is async; a `useRef` ensures the swipe limit check is synchronous and race-condition-free
- **Unique Realtime channel names** — prevent duplicate message delivery on re-mount with `chat:${matchId}:${Date.now()}`
- **Global 401 handler** — any expired token automatically triggers logout without user-facing errors

## Database Schema

Core tables: `profiles`, `swipes`, `matches`, `messages`, `startup_ideas`, `idea_interests`, `blocks`, `reports`

Key RPC functions:
- `process_swipe` — atomic swipe + mutual match check + daily limit enforcement
- `get_excluded_user_ids` — excludes swiped/blocked/matched users from discover
- `get_discover_ideas` — idea discovery with category filter, sort, and interest counts
- `get_user_notifications` — aggregates matches, messages, and idea interests into activity feed
- `unmatch_users` — atomically deletes match records and clears swipes

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Python 3.11+
- Supabase account
- Render account

### Frontend
```bash
cd StartupMatch
npm install
npx expo start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0
```

### Environment Variables

**Backend `.env`:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Build for Android
```bash
eas build --platform android --profile preview
```

## Project Structure

```
StartupMatch/
├── app/
│   ├── (auth)/          # Login & register screens
│   ├── (tabs)/          # Main tabs: Discover, Matches, Activity, Profile
│   ├── chat/[id].tsx    # Real-time chat screen
│   ├── paywall.tsx      # Pro subscription screen
│   └── settings.tsx     # Account settings
├── backend/
│   ├── app/
│   │   ├── routers/     # FastAPI route handlers
│   │   ├── schemas/     # Pydantic models
│   │   └── utils.py     # Compatibility scoring algorithm
│   └── supabase/
│       └── migrations/  # SQL migrations (016 total)
├── components/          # SwipeCard, MatchModal, Avatar, etc.
├── context/             # AuthContext, MatchesContext
└── services/            # API client, Supabase client
```

## Screenshots

> Available on request — Android APK available for demo

---

Built by **Phuc Duong** · [GitHub](https://github.com/PhucDuon/foundly)

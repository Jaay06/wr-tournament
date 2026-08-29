# UI/UX Guidelines

## Design Principles

- Clean, modern, mobile-first.
- Use plenty of whitespace, clear typography.
- Animations should be subtle and purposeful (e.g., micro-interactions for buttons, smooth transitions on team builder).
- Tier colors:
  - **T1**: Gold (`#FFD700`)
  - **T2**: Silver (`#C0C0C0`)
  - **T3**: Bronze (`#CD7F32`)
  - **T4**: Grey (`#808080`)
- Team validity indicator: green checkmark for valid, red cross for invalid, yellow warning if pending review.

## Page Layouts

### Landing Page

- Hero section with tournament name, tagline, registration deadline countdown.
- CTA button “Register Now” (or “Login” if already registered).
- Cards for tier definitions and team rules.

### Registration / Login

- Two main buttons: “Continue with Discord” and “Email / Password”.
- After auth, a multi-step form for profile (Summoner Name, Region, Current Rank dropdown, Self‑Assessed Tier radio buttons with tooltips).
- Success message: “Your tier is pending admin review.”

### Player Dashboard

- Top: user info, registration status card (pending/approved tier with color).
- Team section:
  - If no team: two buttons “Create Team” and “Browse Teams”.
  - If in team: team name, team builder widget showing slots (5–7 circles) colored by tier, member names, validity icon.
- Deadline banner: “Registration closes in X days Y hours” or “Registration closed.”

### Team Builder Widget

- Horizontal row of slots (5–7 depending on settings).
- Each slot shows player avatar, name, tier badge (colored).
- Empty slots are dashed outlines.
- When adding a player, animation: slot scales up and fades in.
- If team is invalid, a warning tooltip explains the violated rule.

### Admin Dashboard

- Sidebar navigation: Players, Teams, Announcements, Settings.
- Players tab: table with filters (tier, status, team). Each row has actions: Approve/Override tier, Move player.
- Teams tab: grid of team cards showing composition and validity. Click to edit.
- Settings: form fields for team size, tier rules, deadline picker.

### General Components

- Buttons: rounded, subtle shadow, hover effect.
- Inputs: clean with focus ring.
- Cards: soft shadow, border-radius 8px.
- Modals for confirmations (e.g., leaving team, admin override warning).

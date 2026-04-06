# WEB DESIGN HANDOVER PLAN

## Goal

Create one static HTML mockup that shows how the ad platform site should look and feel before full frontend development.

This is a design-first deliverable, not a working app.

## What The Designer Should Deliver

1. One complete HTML file mockup (desktop and mobile responsive)
2. One CSS file (or embedded CSS in the HTML for first pass)
3. Optional small JS for menu toggle and simple interactions
4. Visual style proposal (colors, typography, spacing, component look)
5. Notes on reusable UI components

## Scope For Mockup (Do This)

1. Navigation/header
- Logo area
- Main nav links (Dashboard, Tokens, Accounts, Campaigns, Reports)
- Primary CTA button (Connect Account)

2. Hero/intro area
- Clear headline
- Short supporting paragraph
- Two CTA buttons (Primary + Secondary)

3. Status cards section
- API Health card
- Version card
- Connection summary card

4. Tokens section (UI only)
- Form fields: Client ID, Platform, Access Token, Refresh Token, Expires At
- Save button
- Example saved token card/table row

5. Accounts section (UI only)
- Form fields: Client ID, Platform, External Account ID, Name
- Save button
- Example account list/table

6. Placeholder sections (UI only)
- Clients panel (coming soon)
- Campaigns panel (coming soon)
- Reports panel (coming soon)

7. Footer
- Simple product text
- Version placeholder

## Out Of Scope For Mockup

1. Real API calls
2. Authentication/OAuth implementation
3. Data persistence
4. Complex chart logic

## Layout Guidance

1. Use a clean dashboard style with clear hierarchy
2. Use a max content width and consistent spacing scale
3. Keep cards/components visually consistent
4. Ensure mobile responsiveness down to 360px width
5. Keep forms readable with clear labels and validation placeholders

## Suggested Design Direction

1. Tone: trustworthy, modern, professional
2. Palette: neutral background + one strong accent color
3. Typography: one display font + one readable body font
4. Components: rounded cards, soft shadows, clear button states
5. Motion: subtle transitions only (hover, section reveal)

## HTML Mockup Structure Suggestion

1. Header
2. Hero
3. Quick status cards
4. Tokens module block
5. Accounts module block
6. Coming soon modules block
7. Footer

## Accessibility Requirements

1. Semantic HTML elements (header, nav, main, section, footer)
2. Visible labels for all form controls
3. Sufficient color contrast
4. Keyboard-focus visible states
5. Alt text for any meaningful images/icons

## Handoff Acceptance Checklist

1. Mockup opens in browser with no broken layout
2. Looks good on desktop and mobile
3. Clearly shows all major product sections
4. Includes tokens and accounts UI forms
5. Marks clients/campaigns/reports as coming soon
6. Follows accessibility basics
7. Easy for developer to convert into real app screens

## Suggested File Names

- mockup.html
- mockup.css
- mockup-notes.md

## Backend Context To Keep In Mind

Currently implemented backend modules:
- Tokens
- Accounts

Current placeholder backend modules:
- Clients
- Campaigns
- Reports

The mockup should visually include all modules, but only Tokens and Accounts should be treated as active screens.

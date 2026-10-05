# Photo Card, E-Paper and Ads on top of the existing Reporter system

## What exists today (kept as-is)
- Reporter registration, login, dashboard, profile pages (`/representative/*`)
- Reporter data in the existing profile + role tables (role REPRESENTATIVE, district/upazila, designation, representative ID, photo)
- Reporter news in the existing news table (submit -> admin review -> publish)
- No changes to reporter login, permissions, or existing accounts. No new reporter tables.

## 1. Photo Card ("ফটোকার্ড তৈরি")
- Button appears on a published news page, and in the reporter's "আমার সংবাদ" list for published items.
- Visible to: the reporter who wrote it, and admins.
- Opens a preview of a branded red/black/white square card: featured image, headline, reporter name + designation + district (from the existing profile/news), date, logo, website URL.
- Download as PNG (made in the browser), plus share.
- No database changes.

## 2. Daily E-Paper
- New public page `/epaper` with a date picker; shows that day's published news laid out as newspaper pages (lead story, columns, reporter byline from existing data). Print/PDF supported.
- Every published news (including reporter news) is automatically included by its publish date — no extra step.
- Admin can mark/unmark a news item "ই-পেপারে নয়" (one new yes/no field on the existing news table, default included).
- Link added to header/footer.

## 3. Advertisement
- New ads table (title, image, link, placement: header / sidebar / in-article, active, start/end dates).
- Admin page `/admin/ads` to create/edit/disable ads (Ads permission module already exists).
- Ads shown on homepage, news page and e-paper in their placements.
- Reporter permissions unchanged.

## 4. Compatibility
- Workflow unchanged; existing reporter accounts and news untouched.
- Test with Playwright: reporter login, submit, admin publish, photo card download, e-paper day view, ad display — mobile and desktop.

## Technical details
- Migration: `news.epaper_exclude boolean default false`; `ads` table with public SELECT of active ads, admin write via `has_permission(auth.uid(),'ads')`, grants.
- Photo card: `src/components/PhotoCardDialog.tsx` using canvas (images via existing media proxy for CORS).
- E-paper: `src/routes/epaper.tsx` with search param `date`, query in `src/lib/queries.ts`.
- Ads: `src/lib/ads.ts`, `src/components/AdSlot.tsx`, `src/routes/admin.ads.tsx`, nav entry in AdminShell.

# Public Homepage Upgrade

## Scope
Upgrade only the public homepage and homepage-specific presentation components. Preserve the existing header, mobile category bar, authentication, admin panel, representative system, routes, and database connections.

## Implementation
- Replace the current homepage composition with an original Bengali editorial layout: breaking ticker, one lead story plus three secondary stories, latest-news feed, popular-news rail, district-news band, and category sections.
- Use only rows whose status is `PUBLISHED`, ordered and limited at query level; use `is_breaking` for the ticker and existing `views` for popularity.
- Make all story surfaces link to the existing news detail route, and route category/district/latest actions to existing public listing pages.
- Add homepage-specific responsive cards with stable image ratios, lazy loading below the fold, Bengali metadata, thin separators, and compact mobile treatment while retaining red/black/white tokens.
- Refresh homepage queries periodically and on page revisit/focus so newly published stories appear without hardcoded content.
- Show the requested professional Bengali empty state when no published news exists; omit empty ticker/category/district sections.

## Technical Details
- Keep data reads in the existing query layer and add focused, limited published-news query helpers where needed.
- Avoid changing the header or `CategoryNav` implementation.
- Add homepage route metadata fields required by the current app conventions.
- Verify links and PUBLISHED-only query behavior, then test Android-sized, iPhone-sized, tablet, and desktop layouts in the browser; confirm no build/runtime errors.

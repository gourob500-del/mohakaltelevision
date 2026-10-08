# দৈনিক মহাকাল — স্বয়ংক্রিয় ৪ পৃষ্ঠার ই-পেপার

## যা তৈরি হবে
1. **লোগো** — আপনার দেওয়া "দৈনিক মহাকাল" লোগো ই-পেপারের মাস্টহেডে; অ্যাডমিন সেটিংস থেকে পরিবর্তনযোগ্য।
2. **দৈনিক ই-পেপার (সর্বোচ্চ ৪ পৃষ্ঠা)** — প্রতিদিন রাত ১২টার পর (বাংলাদেশ সময়) আগের দিনের শুধু Published সংবাদ (published_at অনুযায়ী) দিয়ে তৈরি। একই তারিখে একটিই ই-পেপার; পুনরায় তৈরি করলে আগেরটি হালনাগাদ হয়, ডুপ্লিকেট হয় না।
   - পৃ. ১ প্রধান সংবাদ, পৃ. ২ জাতীয়/আন্তর্জাতিক/রাজনীতি, পৃ. ৩ জেলা-উপজেলা, পৃ. ৪ খেলা/বিনোদন/অন্যান্য + বিজ্ঞাপন। কোন বিভাগ কোন পৃষ্ঠায় — অ্যাডমিন বদলাতে পারবেন।
   - জায়গা না ধরলে গুরুত্ব (প্রধান/ব্রেকিং), সময় ও বিভাগ দেখে বাছাই; বাকি সংবাদ ওয়েবসাইটে যেমন আছে থাকবে। খালি পৃষ্ঠা তৈরি হবে না।
   - সংবাদ পূর্ণ বাক্যে সংক্ষিপ্ত হবে (বাক্যের মাঝে কাটা হবে না), প্রতিটিতে "বিস্তারিত পড়ুন" লিংক।
3. **কলাম বিন্যাস** — ২/৩/৪ কলাম, প্রধান সংবাদ বড়, ছবি অনুপাত ঠিক রেখে, সংবাদদাতা ও ক্যাপশনসহ। SolaimanLipi ফন্ট (ইতিমধ্যে প্রকল্পে আছে, লাইসেন্স যাচাই করা) সব জায়গায়।
4. **বিজ্ঞাপন ম্যানেজার** — JPG/PNG/WebP আপলোড, নাম, প্রতিষ্ঠান, লিংক, শুরু/শেষ তারিখ, পৃষ্ঠা (একাধিক), অবস্থান (উপরে/নিচে/বাম/ডান/মাঝে/পূর্ণ পৃষ্ঠা), আকার, চালু/বন্ধ। মেয়াদ শেষে নিজে থেকে বন্ধ। বিজ্ঞাপন নিজস্ব ব্লকে বসবে, সংবাদ ঢাকবে না।
5. **টেমপ্লেট** — প্রথম/সাধারণ/স্থানীয়/বিজ্ঞাপন পৃষ্ঠার টেমপ্লেট; কলাম, ফন্ট সাইজ, রং, মার্জিন নিয়ন্ত্রণ। প্রকাশিত পুরোনো ই-পেপার নিজে থেকে বদলাবে না — অ্যাডমিন "পুনরায় তৈরি" করলে বদলাবে।
6. **পাঠকের ভিউয়ার** (/epaper) — তারিখ বাছাই, আর্কাইভ, ৪ পৃষ্ঠার থাম্বনেইল, আগের/পরের, জুম, মোবাইল-উপযোগী; পূর্ণ PDF ও আলাদা পৃষ্ঠা প্রিন্ট/PDF, A4/A3।
7. **অ্যাডমিন ই-পেপার ড্যাশবোর্ড** — আজকের অবস্থা, সর্বশেষ তৈরির সময়, পৃষ্ঠা (সর্বোচ্চ ৪), সংবাদসংখ্যা, পরবর্তী স্বয়ংক্রিয় সময়, অটোমেশন চালু/বন্ধ, এখনই তৈরি, নির্দিষ্ট তারিখ পুনরায় তৈরি, কোন সংবাদ কোন পৃষ্ঠায় হাতে বদলানো, প্রকাশ/অপ্রকাশ, লগ ও Retry, ৪ পৃষ্ঠা পার হলে সতর্কবার্তা।

## অটোমেশন ও সীমাবদ্ধতা (স্পষ্টভাবে)
- আপনার ব্যাকএন্ডে সার্ভার-সাইড নির্ধারিত কাজ চালানো যায়। প্রতিদিন বাংলাদেশ সময় রাত ১২:১০-এ (দিনে ১ বার) সার্ভার নিজে থেকে ই-পেপার তৈরি করবে — ব্রাউজার খোলা থাকতে হবে না। ব্যর্থ হলে লগে কারণ থাকবে ও ড্যাশবোর্ড থেকে Retry করা যাবে।
- **PDF:** ব্রাউজারের "Save as PDF" প্রিন্ট পদ্ধতি ব্যবহার হবে — এতে বাংলা ফন্ট ও লেখা নিখুঁত থাকে এবং পৃষ্ঠা-বিরতি দিয়ে ঠিক ৪টির বেশি পৃষ্ঠা হয় না। সার্ভারে আলাদা PDF ফাইল তৈরি এই হোস্টিংয়ে সম্ভব নয় (প্রয়োজনীয় টুল চলে না)।
- আগের ধাপে মুছে দেওয়া ওয়েবসাইট বিজ্ঞাপন ফিরিয়ে আনা হবে না; শুধু ই-পেপার বিজ্ঞাপন।
- বিদ্যমান সংবাদ, URL, প্রতিনিধি/অ্যাডমিন অ্যাকাউন্ট, ফটোকার্ড অপরিবর্তিত। শুধু নতুন তালিকা যোগ হবে, কিছু মোছা হবে না।

## Technical details
- New tables: `epaper_settings` (singleton: automation_enabled, logo_url, page→category mapping jsonb, active template ids), `epaper_templates` (page_kind, columns, font sizes, colors, margins, ad slots), `epaper_issues` (issue_date UNIQUE, source_date, status DRAFT/PUBLISHED, pages jsonb snapshot of news ids/excerpts/ads/template, generated_at, news_count), `epaper_ads` (title, org, image_url, link, starts_at, ends_at, pages int[], position, size, is_active), `epaper_runs` (log: issue_date, trigger, status, error, timestamps). Anon SELECT only published issues + active ads; admin write via has_permission('epaper'). Existing `news.epaper_exclude` reused.
- Pure layout engine `src/lib/epaper-layout.ts` (shared server/client): Dhaka-day window `[D-1 00:00+06, D 00:00+06)` on `published_at` (UTC stored, single conversion), sentence-boundary excerpts, capacity per page in "units", hard clamp `pages.slice(0,4)`. Vitest tests for date window, 4-page cap, no-duplicate, ad-occupancy.
- Generation in a server function (admin) and `/api/public/hooks/epaper-daily` route requiring `LOVABLE_CRON_SECRET`; upsert on issue_date. pg_cron `10 18 * * *` UTC.
- Logo uploaded via lovable-assets; print CSS `@page { size: A4|A3 }`, `break-after: page`, FontFace awaited before `window.print()`.

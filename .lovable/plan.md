# MOHAKAL TELEVISION — বাকি কাজ সম্পন্নকরণ

## লক্ষ্য
বর্তমান ওয়েবসাইট, নিউজ ও প্রতিনিধি ব্যবস্থা অপরিবর্তিত রেখে সব অসম্পূর্ণ অ্যাডমিন এবং পাবলিক নিউজ ফিচার সম্পন্ন করা। সব তথ্য বর্তমান Lovable Cloud ডেটা থেকে আসবে।

## বাস্তবায়ন

### ১. অ্যাডমিন ব্যবহারকারী ও অনুমতি
- `/admin/users` পাতায় শুধু Super Admin-এর জন্য নতুন Admin তৈরি, Admin/Super Admin ভূমিকা, অ্যাকাউন্টের অবস্থা এবং মডিউলভিত্তিক অনুমতি সম্পাদনা যোগ করা।
- News, Representative, Ads, E-paper, Category, District/Upazila, Settings, Users ও Logs অনুমতি দেখানো ও সংরক্ষণ করা।
- Admin sidebar ও প্রতিটি সংশ্লিষ্ট পাতায় কার্যকর অনুমতি যাচাই করা; Super Admin সবকিছু পাবেন। অনুমতিহীন Admin ব্যবস্থাপনার তথ্য দেখতে বা পরিবর্তন করতে পারবেন না।
- বিদ্যমান account creation ও role tables ব্যবহার করা এবং গুরুত্বপূর্ণ পরিবর্তন activity log-এ রাখা।

### ২. Activity Logs ও Moderation
- `/admin/logs` পাতায় বাস্তব activity log তালিকা, action/user/entity/date filter এবং পরিষ্কার Bengali empty state যোগ করা।
- `/admin/moderation` পাতায় pending/approved comments এবং open/resolved reports দেখা, comment approve/hide/delete ও report resolve/reopen/delete যোগ করা।
- Admin navigation-এ Users এবং Comments/Reports যোগ করা, permission অনুযায়ী দেখানো।

### ৩. Watermark Settings
- Website Settings-এ watermark ON/OFF, position এবং opacity controls যোগ করা।
- সংরক্ষণের পর upload watermark cache refresh করা, যাতে পরের আপলোডেই নতুন settings কার্যকর হয়।
- বিদ্যমান burned-in watermark upload flow বজায় রাখা; downloaded stored image-এ watermark থাকবে।

### ৪. Public News Action Bar
- নিউজ পাতায় mobile-friendly action bar যোগ করা: Facebook, WhatsApp, Messenger, Copy Link, Print, PDF, Bookmark, Font +/−, Read Aloud, Comment ও Report।
- শেয়ারে exact URL ও title পাঠানো; Open Graph metadata-তে বর্তমান article title/image বজায় রাখা।
- Bookmark browser-এ স্থায়ী রাখা, font size সীমার মধ্যে পরিবর্তন, Bengali speech synthesis start/stop করা।
- Print/PDF-এর জন্য print-specific layout করা যাতে শুধু logo, headline, reporter, date, content, featured image ও gallery থাকে; browser print dialog থেকেই PDF save করা যাবে।

### ৫. Comments, Reports ও News Navigation
- অনুমোদিত comments দেখানো এবং guest/signed-in comment submission form যোগ করা।
- report reason/details/contact form যোগ করা এবং সফল submission state দেখানো।
- signed-in ownership database-এ authenticated identity থেকে বাধ্যতামূলক করা; guest row-তে owner খালি থাকবে এবং caller-supplied অন্য owner গ্রহণ করা হবে না।
- একই প্রকাশিত feed থেকে Previous/Next links এবং বর্তমান category-এর Related News রাখা।

## Technical Details
- বিদ্যমান semantic design tokens, shared Button/form components এবং Bengali UI conventions অনুসরণ করা হবে।
- Comments/reports insert policies শক্ত করা হবে: authenticated row-এর `user_id = auth.uid()`, guest row-এর `user_id IS NULL`; moderation শুধু Admin/Super Admin।
- Admin page access UI permission এবং existing database RLS—দুই স্তরে সীমিত থাকবে; privileged account creation server-side Super Admin verification বজায় রাখবে।
- নতুন routes-এ unique title, description, Open Graph metadata, noindex এবং Bengali headings থাকবে।
- `roadmap.md`-এর প্রতিটি কাজ বাস্তবায়নের পরে complete করা হবে।

## যাচাই
- Type/build status এবং runtime/console errors পরীক্ষা করা।
- Mobile ও desktop-এ public action bar, dialogs, comments/reports, previous/next এবং print view পরীক্ষা করা।
- Signed-out guest comment/report এবং signed-in ownership আলাদাভাবে পরীক্ষা করা; অন্য user ID প্রয়োগ করা যায় না নিশ্চিত করা।
- Super Admin users/permissions/logs/moderation/settings flow এবং restricted Admin navigation/access পরীক্ষা করা।

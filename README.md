# Mohakal Tv

Build the first production-ready version of a Bengali online news portal called MOHAKAL TELEVISION.



IMPORTANT:

This is STEP 1 only.



Do NOT build fake/mock functionality.

Do NOT use placeholder buttons that do nothing.

Create the actual working foundation of the application with a real database, authentication, role-based permissions, news management and responsive UI.



The application will initially run on the Lovable URL:



https://mohakaltelevision.lovable.app



Do not use or reference the old website:

mohakaltv.jo3.org



---



BRAND IDENTITY



Brand Name:

MOHAKAL TELEVISION



Tagline:

"আপনার আয়োজন, আমাদের সংবাদ"



Website:

https://mohakaltelevision.lovable.app



Contact:

01966658179



Primary Language:

Bengali (Bangladesh)



Design:

Premium Bangladeshi digital TV news portal.



Color direction:

Red + Black + White



Typography:

Use a clean, highly readable Bengali font such as Noto Sans Bengali.



The website must be mobile-first and fully responsive.



---



STEP 1 — CORE FEATURES



Build these features first:



1. Public News Website

2. User Authentication

3. Representative Login

4. Representative Dashboard

5. Representative News Submission

6. Admin Login

7. Admin Dashboard

8. News Review & Approval

9. News Publishing

10. Category Management

11. District & Upazila Management

12. Basic Media Upload

13. User/Role Management

14. Website Settings



Do not implement advanced Google SEO, Google News, automatic photo-card generation or advertisement management yet.



Those will be added in later steps.



---



1. PUBLIC HOMEPAGE



Create a professional homepage.



Header:



- MOHAKAL TELEVISION logo/text

- Tagline

- Navigation menu

- Search button

- Representative Login

- Admin Login



Main navigation:



- প্রচ্ছদ

- সর্বশেষ

- জাতীয়

- আন্তর্জাতিক

- জেলা

- ধর্ম

- শিক্ষা

- রাজনীতি

- বিনোদন

- খেলাধুলা

- অন্যান্য



Homepage sections:



Breaking News



Create a scrolling/ticker-style breaking-news section.



Latest News



Display the newest published articles.



Top News



Display selected important news.



Category Sections



Show news by category.



District News



Show recent district-based news.



Popular News



Show articles with the highest view count.



Footer



Include:



- MOHAKAL TELEVISION

- Tagline

- About

- Contact

- Important links

- Copyright

- Social media placeholders controlled from Admin Settings



---



2. PUBLIC NEWS CARD



Each news card should display:



- Featured image

- Headline

- Category

- District/location

- Publication date

- Reporter name

- View count



Clicking a news card must open the actual news details page.



---



3. NEWS DETAILS PAGE



Create a dedicated page for every published article.



Display:



- Headline

- Featured image

- Caption

- Reporter name

- Reporter designation

- District

- Upazila/location

- Publication date

- Last updated date

- Full article content

- View count

- Related news



Only published news can be publicly accessible.



Draft, pending and rejected news must not appear publicly.



---



4. AUTHENTICATION



Implement real authentication.



Create:



- Login

- Logout

- Forgot Password where supported

- Protected routes

- Session handling



Do not store passwords in plain text.



Use the authentication/database system supported by Lovable.



---



5. USER ROLES



Create these roles:



SUPER_ADMIN



Full access.



ADMIN



Can manage news, representatives, categories and website settings.



REPRESENTATIVE



Can submit and manage only their own news submissions and profile.



VISITOR



Public website visitor with no administrative permissions.



Implement real role-based access control.



A representative must never be able to access Admin functionality simply by manually entering an admin URL.



---



6. REPRESENTATIVE LOGIN



Create a dedicated:



/representative/login



page.



Login fields:



- Mobile number or email

- Password



After successful login, redirect to:



/representative/dashboard



---



7. REPRESENTATIVE DASHBOARD



Create a professional Bengali dashboard.



Show:



- প্রতিনিধি নাম

- Representative ID

- Designation

- District

- Upazila

- Total submitted news

- Pending news

- Approved news

- Published news

- Rejected news



Dashboard menu:



- Dashboard

- নিউজ জমা দিন

- আমার নিউজ

- Draft

- Pending

- Published

- Profile

- Logout



---



8. REPRESENTATIVE PROFILE



Representative profile fields:



- Full Name

- Profile Photo

- Mobile Number

- Email

- District

- Upazila

- Designation

- Representative ID

- Joining Date

- Account Status



Representative ID must be unique.



Example format:



MTV-NAR-0001



Do not expose private authentication information publicly.



---



9. NEWS SUBMISSION



Create:



/representative/news/create



Fields:



- News Title

- Short Summary

- Full News

- Category

- Division

- District

- Upazila

- Location

- Featured Image

- Caption

- Video URL

- News Source/Reference

- Reporter Name



Buttons:



SAVE DRAFT



SUBMIT FOR REVIEW



When saved as draft:



Status = DRAFT



When submitted:



Status = PENDING



Representative cannot publish news directly.



---



10. NEWS STATUS SYSTEM



Create these statuses:



DRAFT



PENDING



CORRECTION_REQUIRED



APPROVED



PUBLISHED



REJECTED



The representative must be able to see the status of their own submissions.



---



11. ADMIN LOGIN



Create:



/admin/login



Only ADMIN and SUPER_ADMIN accounts can access the Admin Panel.



After login:



/admin/dashboard



---



12. ADMIN DASHBOARD



Create a professional administration panel.



Dashboard statistics:



- Total News

- Pending News

- Published News

- Draft News

- Rejected News

- Total Representatives

- Active Representatives



Admin navigation:



Dashboard



News Management



- All News

- Pending News

- Published News

- Drafts

- Rejected News



Representatives



- All Representatives

- Add Representative

- Pending Representatives

- Active Representatives



Categories



Districts



Upazilas



Media Library



Website Settings



Activity Logs



Logout



---



13. ADMIN NEWS REVIEW



Admin must be able to open any submitted news.



Actions:



- View

- Edit

- Approve

- Reject

- Request Correction

- Publish

- Unpublish

- Delete



When Admin requests correction:



Status = CORRECTION_REQUIRED



Representative should be able to edit and resubmit the news.



When Admin approves:



Status = APPROVED



When Admin publishes:



Status = PUBLISHED



---



14. PUBLISHING RULE



IMPORTANT:



Representatives must NEVER be able to directly publish news.



Only:



SUPER_ADMIN



or authorized ADMIN



can publish news.



Public users can only see:



PUBLISHED news.



---



15. CATEGORY MANAGEMENT



Admin can:



- Create category

- Edit category

- Delete category

- Activate/deactivate category



Initial categories:



- জাতীয়

- আন্তর্জাতিক

- রাজনীতি

- শিক্ষা

- ধর্ম

- জেলা

- স্থানীয়

- বিনোদন

- খেলাধুলা

- অর্থনীতি

- প্রযুক্তি

- অন্যান্য



Make categories database-driven.



Do not hard-code the entire category system into the frontend.



---



16. DISTRICT MANAGEMENT



Create database tables and Admin management for:



Division



District



Upazila



Admin can add/edit/activate/deactivate locations.



Representatives can select their assigned district and upazila.



News can be filtered by:



- Division

- District

- Upazila



---



17. MEDIA UPLOAD



Implement basic image upload.



Allow:



- Featured image

- News images

- Profile image



Validate:



- File type

- File size

- Image dimensions where appropriate



Do not allow executable files to be uploaded as images.



Create a basic Media Library for Admin.



---



18. NEWS VIEW COUNTER



Each published news article should have a view count.



Increment views when a public visitor opens the article.



Avoid artificially increasing views from repeated rapid requests where technically possible.



Admin can see view counts.



---



19. SEARCH



Create a basic public search page.



Users can search news by:



- Headline

- Category

- District

- Upazila



Display search results with pagination.



---



20. ADMIN REPRESENTATIVE MANAGEMENT



Admin can:



- Add representative

- Edit representative

- Activate representative

- Suspend representative

- View representative

- View representative's submitted news

- Reset account access where supported



Representative status:



ACTIVE



SUSPENDED



PENDING



A suspended representative cannot submit news.



---



21. WEBSITE SETTINGS



Create:



Admin → Website Settings



Fields:



- Website Name

- Tagline

- Logo

- Favicon

- Contact Number

- Email

- About Text

- Facebook URL

- YouTube URL

- Other Social Links



Default values:



Website Name:

MOHAKAL TELEVISION



Tagline:

আপনার আয়োজন, আমাদের সংবাদ



Contact:

01966658179



Website:

https://mohakaltelevision.lovable.app



---



22. DATABASE



Create a proper relational database.



Suggested tables:



users



representatives



news



categories



divisions



districts



upazilas



media



website_settings



activity_logs



Create proper foreign-key relationships.



Important relationships:



Representative → News



Category → News



District → News



Upazila → News



User → Role



---



23. SECURITY



Implement:



- Authentication

- Authorization

- Role-based access

- Protected Admin routes

- Protected Representative routes

- Secure password handling

- Input validation

- File upload validation

- Database security rules

- Ownership checks



A representative must only be able to edit/delete their own eligible submissions.



Admin can manage all news.



SUPER_ADMIN has complete system control.



---



24. ACTIVITY LOG



Create an activity log.



Record important actions such as:



- Login

- Logout

- News submission

- News editing

- News approval

- News rejection

- News publication

- Representative activation

- Representative suspension

- Admin changes



Store:



- User

- Action

- Date/time

- Related record where applicable



---



25. RESPONSIVE DESIGN



The public website must work properly on:



- Android phones

- iPhones

- Tablets

- Desktop

- Large screens



Admin and Representative dashboards must also be mobile responsive.



Prioritize mobile usability.



---



26. UI REQUIREMENTS



Public website:



Professional Bangladeshi TV news portal.



Use:



- Red

- Black

- White

- Modern cards

- Clean spacing

- Strong headlines

- Bengali typography



Admin dashboard:



Professional but simple.



Representative dashboard:



Simple and easy for reporters to use from mobile phones.



Avoid unnecessary animations.



Prioritize speed and usability.



---



27. DEMO / INITIAL SETUP



Create an initial setup mechanism for the first SUPER_ADMIN account.



Do NOT expose default passwords in the public frontend.



Do NOT create publicly accessible demo credentials.



After setup, SUPER_ADMIN should be able to create Admin and Representative accounts.



---



28. IMPORTANT DATA RULE



Do not use fake news as real production content.



If sample data is necessary for development, clearly mark it as DEMO DATA and make it easy to remove.



---



29. IMPORTANT IMPLEMENTATION RULE



Build a real working application.



Do not create a static HTML mockup.



Do not create buttons that only display "Coming Soon".



Every feature included in STEP 1 must actually work.



If a feature requires a backend/database integration, configure the supported backend/database properly.



Do not expose secret keys in frontend code.



---



30. STEP 1 COMPLETION CHECKLIST



Before considering STEP 1 complete, verify:



- Homepage works

- News listing works

- News details works

- Search works

- Authentication works

- Representative login works

- Representative dashboard works

- Representative can create draft

- Representative can submit news

- Admin login works

- Admin dashboard works

- Admin can review news

- Admin can approve/reject news

- Admin can request correction

- Admin can publish news

- Published news appears publicly

- Draft/pending/rejected news stays private

- Category management works

- District management works

- Upazila management works

- Media upload works

- View counter works

- Role permissions work

- Mobile layout works

- Logout works



After completing STEP 1, STOP.



Do not automatically add advanced SEO, Google News, Search Console, automatic photo-card generation, advertisement management or other STEP 2+ features unless explicitly requested.



The foundation must be stable before adding additional modules.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mohakaltelevision.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1cec4d6c-3d80-4907-ad40-94e4a965a12e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# S&D Prophetic School — Complete Handoff Guide
**For Prophet Abiodun Sule and the S&D Admin Team**
*Prepared by JAA (John Ayomide Akinola)*

---

## What Has Been Built

A complete two-year prophetic training school platform at **sandd.abiodunsule.uk** with:

- Public landing page, course catalog, and admissions form
- Student portal with video lessons, quizzes, assignments, and certificates
- Admin control panel for Prophet Abiodun Sule to manage everything
- Automated student onboarding — one click to accept an application

---

## Before You Go Live — 5 Things to Set Up

### 1. Create Your Supabase Project (Free)

1. Go to **https://supabase.com** → Sign up → New Project
2. Name it: `sandd-prophetic-school`
3. Choose a strong database password and save it
4. Go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → Run
5. Go to **Project Settings → API** → copy:
   - Project URL
   - anon / public key
   - service_role key (keep this secret)

---

### 2. Create Your Bunny.net Account (Video Hosting)

1. Go to **https://bunny.net** → Sign up
2. Click **Stream** → Create Library
3. Name it: `sandd-lessons`
4. Copy your **Library ID** (shown in the URL and settings)
5. Go to **API Keys** → copy your API key

> Bunny.net costs approximately $1–5/month for a school of 20–50 students. Videos are private — no ads, no distractions.

---

### 3. Deploy to Vercel

1. Go to **https://vercel.com** → Import Git Repository
2. Connect your GitHub account → select `buildwithjohn/sandd`
3. Add the following **Environment Variables** in Vercel:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_BUNNY_LIBRARY_ID` | Bunny.net → Stream → Library ID |
| `BUNNY_API_KEY` | Bunny.net → API Keys |
| `NEXT_PUBLIC_BUNNY_API_KEY` | Same as BUNNY_API_KEY |
| `NEXT_PUBLIC_APP_URL` | `https://sandd.abiodunsule.uk` |
| `RESEND_API_KEY` | See step 4 below (optional) |

4. Click **Deploy**
5. Once deployed, go to **Settings → Domains** → add `sandd.abiodunsule.uk`
6. Update your domain's DNS to point to Vercel (they will show you the exact records)

---

### 4. Set Up Email Notifications (Optional but Recommended)

1. Go to **https://resend.com** → Sign up (free tier: 3,000 emails/month)
2. Add and verify your domain `abiodunsule.uk`
3. Copy your API key → add as `RESEND_API_KEY` in Vercel

Email is used for:
- Notifying you when a new application arrives
- Sending acceptance emails with login credentials to new students
- Sending congratulations when a student completes Year 1
- Password reset emails

---

### 5. Create the Admin Account

After deploying, run this in your **Supabase SQL Editor** to give yourself admin access:

```sql
-- First, create your account by visiting /auth/login and signing up,
-- OR create it directly here (replace with your real email):

UPDATE profiles
SET role = 'admin'
WHERE email = 'prophetabiodun@youremail.com';
```

Then log in at `sandd.abiodunsule.uk/auth/login` and you'll have full admin access.

---

## How to Use the Platform — Day to Day

### Accepting a New Student

1. Go to **Admin → Applications**
2. Click **Review** on any pending application
3. Read their testimony
4. Click **Accept** — the system automatically:
   - Creates their student account
   - Enrolls them in all 6 Year 1 courses
   - Emails them their login credentials
   - No manual work needed

### Uploading a Video Lesson

1. Go to **Admin → Upload Video**
2. Select the course it belongs to
3. Give it a title and lesson number
4. Select your MP4 file
5. Optionally upload a PDF notes file
6. Click **Upload & Publish**
   - Video uploads directly to Bunny.net
   - Students see it immediately after upload completes

### Posting an Announcement

1. Go to **Admin → Announcements → New**
2. Write your title and message
3. Toggle **Pin** if it should stay at the top
4. Click **Publish** — all students see it instantly

### Grading an Assignment

1. Go to **Admin → Assignments**
2. Click **Read** to expand a submission
3. Enter a grade (0–100) and feedback
4. Click **Save Grade & Notify Student**

### Generating a Certificate

1. Go to **Admin → Certificates**
2. Find the student (they appear here once Year 1 is 100% complete)
3. Click their name to preview the certificate
4. Click **Print / Save as PDF**

---

## How Students Use the Platform

1. They apply at `sandd.abiodunsule.uk/apply`
2. You review and accept their application (one click)
3. They receive an email with their login credentials
4. They log in at `sandd.abiodunsule.uk/auth/login`
5. They begin with the **Welcome Module** on their dashboard
6. They watch lessons, take quizzes, and submit assignments
7. When they complete all Year 1 courses, Year 2 automatically unlocks
8. When they finish the program, you generate and print their certificate

---

## Platform Pages — Quick Reference

| Page | URL | Who Sees It |
|---|---|---|
| Landing page | `/` | Everyone |
| Course catalog | `/courses` | Everyone |
| Apply | `/apply` | Everyone |
| Student login | `/auth/login` | Students |
| Student dashboard | `/portal/dashboard` | Students |
| My courses | `/portal/courses` | Students |
| Watch a lesson | `/portal/lessons/[id]` | Students |
| Assignments | `/portal/assignments` | Students |
| Announcements | `/portal/announcements` | Students |
| Profile | `/portal/profile` | Students |
| Admin dashboard | `/admin/dashboard` | Admin only |
| Review applications | `/admin/applications` | Admin only |
| Upload video | `/admin/upload` | Admin only |
| Manage students | `/admin/students` | Admin only |
| Grade assignments | `/admin/assignments` | Admin only |
| Certificates | `/admin/certificates` | Admin only |
| New announcement | `/admin/announcements/new` | Admin only |

---

## GitHub Repository

**https://github.com/buildwithjohn/sandd**

All code is on the `main` branch. To make changes:
1. Edit files locally or in GitHub's web editor
2. Push to `main`
3. Vercel automatically redeploys within 60 seconds

---

## Monthly Costs Summary

| Service | Cost |
|---|---|
| Vercel (hosting) | Free (Hobby plan) |
| Supabase (database + auth) | Free tier |
| Bunny.net (video) | ~$1–10/month |
| Resend (email) | Free (3,000 emails/month) |
| Domain renewal | ~$15/year |
| **Total** | **~$1–10/month** |

---

## Support

For technical questions or changes to the platform, contact:

**John Ayomide Akinola (JAA)**
Platform & Cloud Infrastructure Engineer
*Built with prayer and precision for the Body of Christ.*

---

*"But the one who prophesies speaks to people for their strengthening, encouraging and comfort." — 1 Corinthians 14:3*

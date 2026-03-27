# S&D Prophetic School Platform
**Sons and Daughters of Prophets — Prophetic Training School**
> sandd.abiodunsule.uk | Celestial Church of Christ

---

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth
- **Video**: Bunny.net (private, no ads, progress tracking)
- **Deployment**: Vercel

---

## Setup in 5 Steps

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase project
- Go to https://supabase.com → New Project
- Run `supabase-schema.sql` in your SQL Editor
- Copy your Project URL and anon key

### 3. Set up Bunny.net
- Go to https://bunny.net → Stream → Create Library
- Note your Library ID
- Upload your first video and copy the Video ID

### 4. Configure environment
```bash
cp .env.example .env.local
# Fill in your Supabase and Bunny.net credentials
```

### 5. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── courses/page.tsx            # Public course catalog
│   ├── apply/page.tsx              # Admissions form
│   ├── portal/
│   │   ├── dashboard/page.tsx      # Student dashboard
│   │   ├── courses/
│   │   │   ├── page.tsx            # All enrolled courses
│   │   │   └── [slug]/page.tsx     # Single course + lessons list
│   │   └── lessons/
│   │       └── [id]/page.tsx       # Video player + quiz + notes
│   └── admin/
│       └── dashboard/page.tsx      # Admin control panel
├── components/
│   ├── layout/Navbar.tsx           # Public navbar
│   ├── video/VideoPlayer.tsx       # Bunny.net player + tracking
│   └── quiz/QuizEngine.tsx         # Full quiz with scoring
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── db.ts                       # All database queries
│   └── utils.ts                    # Utility functions
├── types/index.ts                  # TypeScript types
└── styles/globals.css              # Global styles
```

---

## Adding a Video Lesson (Admin Workflow)

1. Log into Admin Panel → Upload Video
2. Upload .mp4 file (goes to Bunny.net via API)
3. Select the course it belongs to
4. Give it a title and order number
5. Click Publish — students see it immediately

---

## Deploy to Vercel

```bash
# Connect your GitHub repo to Vercel
# Add environment variables in Vercel dashboard
# Set custom domain: sandd.abiodunsule.uk
```

---

## Week 3 Next Steps
- Assignment submission system
- Announcement board for students
- Admin grading interface
- Certificate PDF generation
- Email notifications for new applicants

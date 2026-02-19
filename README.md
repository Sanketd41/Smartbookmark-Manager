# Smart Bookmark Manager

A real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users can sign in with Google OAuth and manage their private bookmarks with real-time synchronization across tabs.

## Live Demo

🔗 **Live URL**: [Your Vercel URL will be here after deployment]

## Features

- ✅ Google OAuth authentication (no email/password)
- ✅ Add bookmarks with title and URL
- ✅ Private bookmarks (each user sees only their own)
- ✅ Real-time updates across multiple tabs
- ✅ Delete bookmarks
- ✅ Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Backend**: Supabase (Auth, Database, Realtime)
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bookmark-manager
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Authentication** → **Providers** → Enable **Google**
   - Add your Google OAuth credentials
   - Add authorized redirect URLs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-vercel-url.vercel.app/auth/callback` (production)

3. Go to **SQL Editor** and run this SQL to create the bookmarks table:

```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

4. Get your project credentials from **Settings** → **API**:
   - Project URL
   - Anon/Public Key

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!
5. Update Supabase Google OAuth redirect URL with your Vercel URL

## Problems Encountered & Solutions

### Problem 1: Privacy Violation - Users Could See Each Other's Bookmarks

**Issue**: Initially, the `fetchBookmarks` function was fetching all bookmarks from the database without filtering by `user_id`. This meant User A could see User B's bookmarks, violating requirement #3.

**Solution**: Added `.eq("user_id", session.user.id)` filter to the Supabase query:

```typescript
const { data } = await supabase
  .from("bookmarks")
  .select("*")
  .eq("user_id", session.user.id)  // Filter by current user
  .order("created_at", { ascending: false });
```

### Problem 2: Real-time Updates Showing Other Users' Bookmarks

**Issue**: The real-time subscription was listening to ALL changes on the bookmarks table, which would trigger updates even when other users added/deleted bookmarks.

**Solution**: Added a filter to the real-time subscription to only listen to changes for the current user:

```typescript
const channel = supabase
  .channel("bookmarks")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "bookmarks",
      filter: `user_id=eq.${session.user.id}`,  // Only listen to current user's changes
    },
    () => fetchBookmarks()
  )
  .subscribe();
```

### Problem 3: Row Level Security (RLS) Configuration

**Issue**: Without proper RLS policies, the database would allow users to access each other's data at the database level, even if the frontend filtered correctly.

**Solution**: Implemented comprehensive RLS policies in Supabase:
- SELECT policy: Users can only view their own bookmarks
- INSERT policy: Users can only insert bookmarks with their own user_id
- DELETE policy: Users can only delete their own bookmarks

This provides defense-in-depth security at the database level.

### Problem 4: Google OAuth Redirect Configuration

**Issue**: Google OAuth requires exact redirect URLs to be whitelisted. During development and production, different URLs are needed.

**Solution**: Added both development and production callback URLs in Supabase Google OAuth settings:
- Development: `http://localhost:3000/auth/callback`
- Production: `https://smartbookmark-manager-delta.vercel.app/#`

### Problem 5: Real-time Subscription Not Working Initially

**Issue**: Real-time updates weren't working because the bookmarks table wasn't added to the Realtime publication.

**Solution**: Ran the SQL command to enable Realtime for the bookmarks table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

## Project Structure

```
bookmark-manager/
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   └── supabase.ts       # Supabase client configuration
├── .env.local            # Environment variables (not in git)
└── README.md             # This file
```

## Testing the App

1. Open the live URL
2. Click "Login with Google"
3. Add a bookmark with a title and URL
4. Open the same URL in another tab/window
5. Add a bookmark in one tab - it should appear in the other tab instantly
6. Delete a bookmark - it should disappear from all tabs
7. Log out and log in with a different Google account - you should see a fresh bookmark list

## License

MIT

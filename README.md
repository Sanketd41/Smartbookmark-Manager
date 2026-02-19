# Bookmark Manager

A real-time bookmark management application built with Next.js, Supabase, and Tailwind CSS. Users can log in with Google, add, edit, and delete bookmarks, and see real-time updates across sessions.

---

## Features
- Google OAuth authentication using Supabase.
- Real-time updates for bookmark changes.
- Add, edit, and delete bookmarks.
- Responsive design with Tailwind CSS.
- Deployed on Vercel.

---

## Problems Faced and Solutions

### 1. **Forgot to Add Redirect URL in Supabase**
**Problem**: During the integration of Google OAuth, I encountered an error: `redirect_uri_mismatch`. This happened because I forgot to add the Vercel deployment URL as an authorized redirect URI in the Supabase dashboard.

**Solution**: I navigated to the Supabase dashboard, went to **Authentication > Providers > Google**,
 and added both the development (`http://localhost:3000`) and production (`https://smartbookmark-manager-delta.vercel.app/`) URLs as authorized redirect URIs. This resolved the issue.

---

### 2. **Integrating Supabase with Google Authentication**
**Problem**: Setting up Google OAuth with Supabase required configuring both the Supabase dashboard and the frontend code.

**Solution**: 
- In the Supabase dashboard, I enabled the Google provider under **Authentication > Providers** and added the required Client ID and Client Secret from the Google Cloud Console.
- In the frontend, I used `supabase.auth.signInWithOAuth` to handle the login process. The `redirectTo` option was dynamically set based on the environment (development or production).

Example:
```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: process.env.NEXT_PUBLIC_BASE_URL + "/auth/callback",
  },
});
```

---

### 3. **Real-Time Updates with Supabase**
**Problem**: Implementing real-time updates for bookmarks required setting up a subscription to database changes.

**Solution**: I used Supabase's `channel` API to listen for `INSERT`, `UPDATE`, and `DELETE` events on the `bookmarks` table. The subscription was filtered to only include changes for the logged-in user.

Example:
```ts
const channel = supabase
  .channel("bookmarks")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "bookmarks", filter: `user_id=eq.${session.user.id}` },
    () => fetchBookmarks()
  )
  .subscribe();
```

---

### 4. **TypeScript Errors**
**Problem**: TypeScript errors, such as `Parameter implicitly has an 'any' type` and `Property 'id' does not exist on type 'never'`, occurred during development.

**Solution**: I defined proper types for the `bookmarks` state and the `editingBookmark` variable using a `Bookmark` interface:
```ts
interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}
const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
```

---

### 5. **Styling Buttons and Centering Content**
**Problem**: The buttons and content layout needed consistent styling and alignment.

**Solution**: I used Tailwind CSS to style all buttons and center the content. For example:
```html
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  Add Bookmark
</button>
```

---

## How to Run the Project

### Prerequisites
- Node.js installed.
- Supabase account.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Sanketd41/Smartbookmark-Manager
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env.local` file in the root directory.
   - Add the following variables:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open the app in your browser:
   - Development: `http://localhost:3000`
   - Production: Your Vercel deployment URL.

---

## Deployment
The app is deployed on Vercel. To deploy:
1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Add environment variables in the Vercel dashboard.
4. Deploy the app.

---

## Technologies Used
- **Next.js**: Framework for building the app.
- **Supabase**: Backend for authentication, database, and real-time updates.
- **Tailwind CSS**: Styling framework.
- **Vercel**: Deployment platform.

---

## Future Improvements
- Add folder organization for bookmarks.
- Implement search functionality.
- Add support for multiple authentication providers.

---

## License
This project is licensed under the MIT License.

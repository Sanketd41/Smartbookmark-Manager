"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}
export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    fetchBookmarks();

    const channel = supabase
      .channel("bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => fetchBookmarks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  const addBookmark = async () => {
    if (!title || !url) return;

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: session.user.id,
    });

    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const editBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark as any);
    setTitle(bookmark.title);
    setUrl(bookmark.url);
  };

  const updateBookmark = async () => {
    if (!editingBookmark) return;

    const updatedBookmark = { ...editingBookmark, title, url };
    // Update bookmark logic (e.g., Supabase update query)

    setBookmarks((prev) =>
      prev.map((b) => (b.id === editingBookmark.id ? updatedBookmark : b))
    );
    setEditingBookmark(null);
    setTitle("");
    setUrl("");
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({ provider: "google" })
          }
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-bold">My Bookmarks</h1>

      <div className="flex gap-2">
        <input
          placeholder="Title"
          className="border p-2 w-1/2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="URL"
          className="border p-2 w-1/2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {editingBookmark ? (
        <button
          onClick={updateBookmark}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Update Bookmark
        </button>
      ) : (
        <button
          onClick={addBookmark}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Bookmark
        </button>
      )}

      <div className="space-y-2">
        {bookmarks.map((b) => (
          <div
            key={b.id}
            className="flex justify-between border p-3 rounded"
          >
            <a href={b.url} target="_blank" className="text-blue-600">
              {b.title}
            </a>

            <div className="flex gap-2">
              <button
                onClick={() => editBookmark(b)}
                className="bg-yellow-500 text-white px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => deleteBookmark(b.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="text-sm text-gray-500"
      >
        Logout
      </button>
    </div>
  );
}

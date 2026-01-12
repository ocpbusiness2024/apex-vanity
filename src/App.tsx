import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { signInWithGoogle, signOut } from "./auth";
import { Session } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,display_name,avatar_url,role")
        .eq("id", session.user.id)
        .single();

      if (!error) setProfile(data);
    }

    loadProfile();
  }, [session]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Apex Vanity</h1>

      {!session ? (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="avatar"
                width={40}
                height={40}
                style={{ borderRadius: 999 }}
              />
            )}
            <div>
              <div>{profile?.display_name ?? session.user.email}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Role: {profile?.role ?? "user"}
              </div>
            </div>
            <button onClick={signOut}>Sign out</button>
          </div>

          {profile?.role === "admin" ? (
            <p>✅ You are admin. Show admin UI here.</p>
          ) : (
            <p>📖 You are a reader. Show chapters + comments here.</p>
          )}
        </>
      )}
    </div>
  );
}

import { supabase } from "../lib/supabase";

const userSelect =
  "id,email,name,department,role,scrutiny,scrutiny_common,photo_url";

export const getSessionUser = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session?.user ?? null;
};

export const subscribeToAuthState = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session ?? null);
  });

  return data.subscription;
};

export const getUserProfileByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select(userSelect)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
};

export const getCurrentUserProfile = async () => {
  const user = await getSessionUser();

  if (!user?.email) {
    return null;
  }

  return getUserProfileByEmail(user.email);
};

export const fetchUserRole = async (email) => {
  const profile = await getUserProfileByEmail(email);
  return profile?.role ?? null;
};

export const signInWithEmailPassword = async (email, password) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signInWithGoogle = async () => {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
};

export const signOutUser = async () => {
  return supabase.auth.signOut();
};

export const signUpWithEmailPassword = async ({
  email,
  password,
  name,
  department,
  role = "faculty",
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  return supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: name.trim(),
        department,
        role,
      },
    },
  });
};

export const upsertUserProfile = async ({
  id,
  email,
  name,
  department,
  role,
  scrutiny = false,
  scrutinyCommon = false,
}) => {
  const { error } = await supabase.from("users").upsert(
    {
      id,
      email,
      name,
      department,
      role,
      scrutiny,
      scrutiny_common: scrutinyCommon,
    },
    {
      onConflict: "email",
    }
  );

  if (error) {
    throw error;
  }

  return true;
};

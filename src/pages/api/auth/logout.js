// src/pages/api/auth/logout.js

export async function POST({ locals: { supabase, redirect } }) {
  await supabase.auth.signOut();
  return redirect("/", 303);
}

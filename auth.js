// ===== AUTH.JS =====
// Supabase Auth: login, signup, session management

import { supabase } from './db.js';
import { gamification } from './gamification.js';

export let currentUser = null;

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    try { gamification.state.userId = session.user.id; gamification._save(); } catch (e) { console.warn('Gamification init failed', e); }
    return session.user;
  }
  return null;
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;
  try { gamification.state.userId = data.user.id; gamification._save(); } catch (e) { console.warn('Gamification init failed', e); }
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
  localStorage.removeItem('studyos_timer');
  try { if (Gamification && typeof Gamification.reset === 'function') Gamification.reset(); } catch(e) {}
  window.location.href = 'index.html';
}

export function getUserName(user) {
  if (!user) return 'Student';
  return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
}

export function getUserInitials(user) {
  if (!user) return 'S';
  const name = getUserName(user);
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    try { if (gamification && typeof gamification.reset === 'function') gamification.reset(); } catch(e) {}
  } else if (session?.user) {
    currentUser = session.user;
    try { gamification.state.userId = session.user.id; gamification._save(); } catch (e) { console.warn('Gamification init failed', e); }
  }
});

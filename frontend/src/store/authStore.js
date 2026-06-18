import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set) => ({
  user   : null,
  session: null,
  loading: true,

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  initialize: async () => {
    // Listen FIRST before anything else
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, '| user:', session?.user?.email ?? 'none');
        set({
          session,
          user   : session?.user ?? null,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  },
}));
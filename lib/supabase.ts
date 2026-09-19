import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Expo Router's static web export prerenders routes in Node, outside a
// browser/RN runtime. AsyncStorage's web backend touches `window` as soon as
// it's used there, which crashes that prerender pass. There's no session to
// persist during prerendering anyway, so fall back to an in-memory no-op.
const isServer = typeof window === 'undefined';

const noopStorage: SupportedStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// Only the anon/publishable key belongs here. The service_role key must
// never be shipped to the mobile app.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: isServer ? noopStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

// Supabase's token auto-refresh timer only ticks while something calls it;
// tying it to app foreground/background state is the documented pattern for
// React Native so refresh stops (saving battery/network) while backgrounded
// and resumes immediately when the app comes back.
if (!isServer) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

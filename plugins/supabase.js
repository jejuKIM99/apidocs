import { createClient } from '@supabase/supabase-js';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseKey = config.public.supabaseAnonKey;
  const supabase = createClient(supabaseUrl, supabaseKey);

  nuxtApp.provide('supabase', supabase);
});
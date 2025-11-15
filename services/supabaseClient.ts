import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xibssyjivjzcjmleupsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYnNzeWppdmp6Y2ptbGV1cHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTMzNjAsImV4cCI6MjA3ODM4OTM2MH0.2HEI12clyZRZ3gM0sUvGq5nFLkGUKKhcfPKyFUMDk34';

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

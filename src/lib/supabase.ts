import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnqfkanmkybhtclhogev.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucWZrYW5ta3liaHRjbGhvZ2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODM4OTQsImV4cCI6MjA1MDQ1OTg5NH0.YxUeBk0gqDFOe4YRPfjHWtR5qalj3OgZGR_9ATY3pAc';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
}); 
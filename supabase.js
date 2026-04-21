const SUPABASE_URL  = 'https://qfrclpmciciabkqtwfml.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcmNscG1jaWNpYWJrcXR3Zm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDc5MzYsImV4cCI6MjA5MjMyMzkzNn0.lUW_WRvH8rGcciQ7NRReSid7p9bOF9emDqVQJDT8njY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

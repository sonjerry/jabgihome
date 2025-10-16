console.log('Test script running...');
console.log('Current directory:', process.cwd());
console.log('Environment check:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});
process.exit(0);

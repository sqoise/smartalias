// Application configuration
export const config = {
  // Server configuration
  port: process.env.PORT || '3000',
  
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Application URLs
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : `http://localhost:${process.env.PORT || '3000'}`,
}

export default config

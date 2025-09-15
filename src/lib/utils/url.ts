/**
 * URL utility functions for handling absolute URLs consistently
 */

/**
 * Get the base URL for the application
 * Falls back to localhost in development if not set
 */
export function getBaseURL(): string {
  // Check for explicitly set base URL first
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // In production, try to construct from Vercel environment
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // In preview/development on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development fallback
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

/**
 * Build an absolute URL from a relative path
 * Ensures the URL has a proper scheme (http/https)
 */
export function buildAbsoluteURL(path: string): string {
  const baseURL = getBaseURL();
  
  // Ensure baseURL has a scheme
  let validBaseURL = baseURL;
  if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
    // In production, default to https; in development, default to http
    const scheme = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
    validBaseURL = `${scheme}${baseURL}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  NEXT_PUBLIC_BASE_URL missing scheme. Using: ${validBaseURL}`);
    }
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash from base URL and combine
  const cleanBaseURL = validBaseURL.endsWith('/') ? validBaseURL.slice(0, -1) : validBaseURL;
  
  return `${cleanBaseURL}${normalizedPath}`;
}

/**
 * Validate that a URL has a proper scheme
 */
export function isValidAbsoluteURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
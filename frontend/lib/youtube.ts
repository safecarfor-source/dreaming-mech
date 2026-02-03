/**
 * YouTube URL Validation and Sanitization
 *
 * Provides secure YouTube URL validation to prevent XSS attacks
 * through malicious URLs.
 */

/**
 * Allowed YouTube domains
 */
const ALLOWED_YOUTUBE_DOMAINS = [
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
];

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    // Validate domain
    if (!ALLOWED_YOUTUBE_DOMAINS.includes(urlObj.hostname)) {
      console.warn('Invalid YouTube domain:', urlObj.hostname);
      return null;
    }

    // Extract video ID from different URL formats
    let videoId: string | null = null;

    // Format: youtube.com/watch?v=VIDEO_ID
    if (urlObj.pathname === '/watch') {
      videoId = urlObj.searchParams.get('v');
    }
    // Format: youtube.com/shorts/VIDEO_ID
    else if (urlObj.pathname.startsWith('/shorts/')) {
      videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0] || null;
    }
    // Format: youtube.com/embed/VIDEO_ID
    else if (urlObj.pathname.startsWith('/embed/')) {
      videoId = urlObj.pathname.split('/embed/')[1]?.split('/')[0] || null;
    }
    // Format: youtube.com/v/VIDEO_ID
    else if (urlObj.pathname.startsWith('/v/')) {
      videoId = urlObj.pathname.split('/v/')[1]?.split('/')[0] || null;
    }
    // Format: youtu.be/VIDEO_ID
    else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1).split('/')[0] || null;
    }

    // Validate video ID format (alphanumeric, underscore, hyphen, 11 chars)
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }

    console.warn('Invalid YouTube video ID format:', videoId);
    return null;
  } catch (error) {
    console.warn('Invalid YouTube URL:', url, error);
    return null;
  }
}

/**
 * Validate YouTube URL and return safe embed URL
 * Returns null if URL is invalid
 */
export function validateAndGetYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  // Return safe embed URL with restricted features
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Convert YouTube Shorts URL to embed URL
 * Legacy function maintained for backward compatibility
 *
 * @deprecated Use validateAndGetYouTubeEmbedUrl instead for better security
 */
export function convertShortsUrl(url: string): string {
  const embedUrl = validateAndGetYouTubeEmbedUrl(url);
  return embedUrl || url; // Fallback to original URL if validation fails
}

/**
 * Validate YouTube URL format
 * Returns true if URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Get YouTube thumbnail URL for a video
 */
export function getYouTubeThumbnail(url: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string | null {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  const qualityMap = {
    'default': 'default',
    'hq': 'hqdefault',
    'maxres': 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Sanitize YouTube URL input from forms
 * Returns cleaned URL or null if invalid
 */
export function sanitizeYouTubeUrl(url: string): string | null {
  if (!url) return null;

  // Remove whitespace
  const trimmed = url.trim();

  // Validate and get embed URL
  const embedUrl = validateAndGetYouTubeEmbedUrl(trimmed);

  if (!embedUrl) {
    return null;
  }

  // Extract video ID and return canonical watch URL
  const videoId = extractYouTubeVideoId(trimmed);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

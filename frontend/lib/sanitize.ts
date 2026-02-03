/**
 * Input Sanitization Utility
 *
 * Provides HTML sanitization to prevent XSS attacks.
 * Uses DOMPurify with safe defaults for React/Next.js applications.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for different sanitization contexts
 */
const SANITIZE_CONFIG = {
  // Strict: Remove all HTML tags, only keep text
  strict: {
    ALLOWED_TAGS: [] as string[],
    ALLOWED_ATTR: [] as string[],
    KEEP_CONTENT: true,
  },

  // Basic: Allow safe formatting tags only
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [] as string[],
  },

  // Rich: Allow more HTML for rich content (descriptions, etc.)
  rich: {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: [] as string[],
  },

  // Links: Allow links with safe attributes
  links: {
    ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):)/i,
  },
};

/**
 * Sanitize HTML string with strict mode (text only)
 * Use for user names, titles, short text fields
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG.strict);
}

/**
 * Sanitize HTML with basic formatting allowed
 * Use for descriptions, comments with minimal formatting
 */
export function sanitizeBasicHTML(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG.basic);
}

/**
 * Sanitize rich HTML content
 * Use for blog posts, detailed descriptions, admin content
 */
export function sanitizeRichHTML(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG.rich);
}

/**
 * Sanitize HTML with links allowed
 * Use for content that needs hyperlinks
 */
export function sanitizeWithLinks(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG.links);
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';

  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [] as string[],
    ALLOWED_ATTR: [] as string[],
  });

  // Additional validation for URL protocol
  try {
    const urlObj = new URL(sanitized);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    if (!allowedProtocols.includes(urlObj.protocol)) {
      console.warn(`Blocked unsafe URL protocol: ${urlObj.protocol}`);
      return '';
    }

    return sanitized;
  } catch (error) {
    // Not a valid URL, treat as relative path
    // Only allow safe relative paths
    if (sanitized.startsWith('/') && !sanitized.startsWith('//')) {
      return sanitized;
    }
    console.warn('Invalid URL format:', url);
    return '';
  }
}

/**
 * Sanitize object by applying sanitization to all string values
 * Useful for sanitizing form data or API responses
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (str: string) => string = sanitizeText
): T {
  const sanitized = { ...obj } as Record<string, any>;

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizer(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item, sanitizer) :
        item
      );
    }
  }

  return sanitized as T;
}

/**
 * React component helper: Sanitize and render HTML
 * Use with dangerouslySetInnerHTML
 *
 * Example:
 * <div dangerouslySetInnerHTML={createSafeMarkup(userContent)} />
 */
export function createSafeMarkup(
  dirty: string,
  mode: 'strict' | 'basic' | 'rich' | 'links' = 'basic'
): { __html: string } {
  let sanitized: string;

  switch (mode) {
    case 'strict':
      sanitized = sanitizeText(dirty);
      break;
    case 'basic':
      sanitized = sanitizeBasicHTML(dirty);
      break;
    case 'rich':
      sanitized = sanitizeRichHTML(dirty);
      break;
    case 'links':
      sanitized = sanitizeWithLinks(dirty);
      break;
    default:
      sanitized = sanitizeText(dirty);
  }

  return { __html: sanitized };
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeText(email).toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Validate and sanitize phone number
 * Returns only digits and allowed characters
 */
export function sanitizePhone(phone: string): string {
  // Remove all characters except digits, +, -, (, ), and spaces
  return phone.replace(/[^\d+\-() ]/g, '').trim();
}

/**
 * Export DOMPurify for custom configurations
 */
export { DOMPurify };

/**
 * Analytics 관련 상수 정의
 */
export const ANALYTICS_DEFAULTS = {
  LIMIT_MIN: 1,
  LIMIT_DEFAULT: 5,
  LIMIT_MAX: 100,
  MONTHS_DEFAULT: 12,
  DAYS_DEFAULT: 7,
  TOP_PAGES_LIMIT: 5,
  DAILY_STATS_LIMIT: 30,
} as const;

/**
 * 시간 관련 상수 (밀리초 단위)
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Secure error logging utility
 * Prevents sensitive error details from being exposed in production console
 */

export const logError = (error: unknown, context: string): void => {
  if (import.meta.env.DEV) {
    // Development: log full error for debugging
    console.error(`[${context}]`, error);
  } else {
    // Production: log only safe metadata without sensitive details
    console.error(`[${context}]`, {
      message: error instanceof Error ? error.message : 'An error occurred',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Safely extract error message without exposing sensitive data
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Return generic message in production, actual message in dev
    if (import.meta.env.DEV) {
      return error.message;
    }
    // Generic messages for common database/auth errors
    if (error.message.includes('RLS') || error.message.includes('policy')) {
      return 'Access denied';
    }
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return 'This record already exists';
    }
    if (error.message.includes('auth') || error.message.includes('token')) {
      return 'Authentication error';
    }
    return 'An error occurred. Please try again.';
  }
  return 'An unexpected error occurred';
};

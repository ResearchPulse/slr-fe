/**
 * Helper to extract error message from axios error or generic error object
 */
export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { 
      response?: { 
        status?: number;
        data?: { 
          message?: string;
          error?: { message?: string };
          errors?: Array<{ message: string }>;
        } 
      } 
    };
    
    // 1. Try top-level message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }
    
    // 2. Try first error in errors array
    if (axiosError.response?.data?.errors?.[0]?.message) {
      return axiosError.response.data.errors[0].message;
    }

    if (axiosError.response?.status) {
      return `The request failed (HTTP ${axiosError.response.status}).`;
    }

    const networkMessage = (error as { message?: unknown }).message;
    if (typeof networkMessage === "string" && networkMessage.trim()) {
      return networkMessage;
    }

    return defaultMessage;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  
  return defaultMessage;
};

/**
 * Machine readable code of an API error (`{ error: { code } }`), or null when the request failed
 * before the server answered.
 */
export const getErrorCode = (error: unknown): string | null => {
  if (error && typeof error === "object" && "response" in error) {
    const code = (error as { response?: { data?: { error?: { code?: unknown } } } }).response?.data?.error?.code;
    return typeof code === "string" ? code : null;
  }
  return null;
};

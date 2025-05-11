import { QueryClient } from "@tanstack/react-query";

type ApiRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryFnOptions = {
  on401?: "throw" | "returnNull";
};

// Create a QueryClient for use with react-query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      queryFn: getQueryFn(),
    },
  },
});

// Helper to make an API request
export async function apiRequest(
  method: ApiRequestMethod,
  path: string,
  body?: any,
) {
  const url = path.startsWith("/api/") ? path : path.startsWith("/") ? `/api${path}` : `/api/${path}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important for cookies/session
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || "An error occurred");
  }

  return response;
}

// Default query function for react-query
export function getQueryFn(options: QueryFnOptions = {}) {
  const { on401 = "throw" } = options;
  
  return async ({ queryKey }: { queryKey: string[] }) => {
    // Extract path from queryKey
    const [path, ...params] = queryKey;
    
    const searchParams = new URLSearchParams();
    params.forEach((param, index) => {
      if (typeof param === "object") {
        Object.entries(param).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      } else {
        searchParams.append(`param${index}`, String(param));
      }
    });
    
    const queryString = searchParams.toString();
    const url = `${path}${queryString ? `?${queryString}` : ""}`;
    
    try {
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data;
    } catch (error) {
      // Special handling for 401 errors
      if (error instanceof Error && 
          error.message.includes("Unauthorized") && 
          on401 === "returnNull") {
        return undefined;
      }
      throw error;
    }
  };
}
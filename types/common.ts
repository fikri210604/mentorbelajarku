export * from "@/lib/traits/response.trait";

// Legacy compatibility aliases
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

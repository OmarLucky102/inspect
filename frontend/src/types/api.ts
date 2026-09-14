export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "fail" | "error";
  message: string | string[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

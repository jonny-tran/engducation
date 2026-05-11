import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  code: string;
  path?: string;
}

const DEFAULT_MESSAGES: { readonly [key: string]: string } = {
  SUCCESS: "Thao tác thành công",
  INTERNAL_SERVER_ERROR: "Lỗi máy chủ nội bộ",
  UNAUTHORIZED: "Vui lòng đăng nhập để tiếp tục",
  FORBIDDEN: "Bạn không có quyền truy cập tài nguyên này",
  NOT_FOUND: "Không tìm thấy tài nguyên yêu cầu",
  BAD_REQUEST: "Yêu cầu không hợp lệ",
  CONFLICT: "Tài nguyên đã tồn tại hoặc xung đột dữ liệu",
  VALIDATION_ERROR: "Dữ liệu đầu vào không hợp lệ",
  TOO_MANY_REQUESTS: "Quá nhiều yêu cầu, vui lòng thử lại sau",
  UNPROCESSABLE_ENTITY: "Dữ liệu không thể xử lý",
  SERVICE_UNAVAILABLE: "Dịch vụ tạm thời không khả dụng",
  GATEWAY_TIMEOUT: "Yêu cầu hết thời gian chờ",
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
};

function getMessage(code: string): string {
  const map = DEFAULT_MESSAGES as Record<string, string>;
  return map[code] ?? "Đã xảy ra lỗi không xác định";
}

export function success<T>(
  data: T,
  message?: string,
  path?: string,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message ?? getMessage("SUCCESS"),
    code: "SUCCESS",
    ...(path ? { path } : {}),
  };
}

export function error(
  message: string,
  code = "INTERNAL_SERVER_ERROR",
  _status = 500,
): ApiResponse<null> {
  void _status;
  return {
    success: false,
    data: null,
    message,
    code,
  };
}

export function httpError(
  message: string,
  code: string,
  _status: number,
): ApiResponse<null> {
  void _status;
  return {
    success: false,
    data: null,
    message,
    code,
  };
}

export function fromTRPCError(
  code: TRPC_ERROR_CODE_KEY,
  message?: string,
): { message: string; code: string; status: number } {
  const statusMap: Record<TRPC_ERROR_CODE_KEY, number> = {
    PARSE_ERROR: 400,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    TIMEOUT: 504,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    METHOD_NOT_SUPPORTED: 405,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    PAYMENT_REQUIRED: 402,
    CLIENT_CLOSED_REQUEST: 499,
    UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_CONTENT: 422,
    PRECONDITION_REQUIRED: 428,
    TOO_MANY_REQUESTS: 429,
  };

  return {
    message: message ?? getMessage(code),
    code,
    status: statusMap[code] ?? 500,
  };
}

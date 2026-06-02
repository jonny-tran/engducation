// src/lib/axios-client.ts
import axios from "axios";
import { env } from "@/env";
import { toast } from "sonner";

export const axiosClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 giây cho các tác vụ AI xử lý lâu
  withCredentials: true, // Gửi cookie session tự động (Better Auth)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động đính kèm Token hoặc credentials trước khi gửi lên Server
axiosClient.interceptors.request.use(
  (config) => {
    // Có thể bổ sung thêm Authorization headers nếu sử dụng Bearer tokens
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi tập trung (401, 429 - Rate Limit, 500)
axiosClient.interceptors.response.use(
  (response) => {
    // Với tRPC batching, response có thể trả về một mảng kết quả
    if (Array.isArray(response.data)) {
      const resultObj = response.data[0];
      if (resultObj && "result" in resultObj) {
        return resultObj.result.data;
      }
      return response.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    
    // Kiểm tra tRPC error format
    let message = error.response?.data?.message;
    if (!message && Array.isArray(error.response?.data)) {
      message = error.response?.data[0]?.error?.json?.message;
    }
    if (!message) {
      message = error.response?.data?.error?.message || "Đã có lỗi hệ thống xảy ra.";
    }

    if (status === 429) {
      toast.error("Bạn đã vượt quá số lần gọi AI cho phép. Vui lòng thử lại sau!");
    } else if (status === 401) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

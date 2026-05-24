// src/features/learning-content/services/ai-api.ts
import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  CheckGrammarRequest,
  CheckGrammarResponse,
  SubmissionHistoryItem,
  WritingAssignmentDetail,
} from "../types/api-contracts";

export const aiWritingApi = {
  submitWriting: async (payload: CheckGrammarRequest): Promise<CheckGrammarResponse> => {
    // Gửi yêu cầu tRPC qua Axios
    const response = await axiosClient.post(API_ENDPOINTS.TRPC.SUBMIT_WRITING, {
      "0": payload,
    });
    return response as unknown as CheckGrammarResponse;
  },

  getHistory: async (writingId: string): Promise<SubmissionHistoryItem[]> => {
    const response = await axiosClient.get(API_ENDPOINTS.TRPC.WRITING_HISTORY(writingId));
    return response as unknown as SubmissionHistoryItem[];
  },

  getDetail: async (writingId: string): Promise<WritingAssignmentDetail> => {
    const response = await axiosClient.get(API_ENDPOINTS.TRPC.WRITING_DETAIL(writingId));
    return response as unknown as WritingAssignmentDetail;
  },
};

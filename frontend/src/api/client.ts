import axios from "axios";
import type { AxiosError } from "axios";
import type { ResultResponse } from "@/types/api";

// VITE_API_BASE_URL 이 비어 있으면 상대 경로("/v1")를 사용하여
// Vite dev 서버 프록시(또는 동일 오리진 배포)를 타도록 한다.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const DEFAULT_ERROR_MESSAGE = "요청 처리 중 오류가 발생했습니다.";

/**
 * 백엔드는 오류 시 { success, message } 형식의 본문을 반환한다.
 * 응답 인터셉터에서 message 를 추출해 Error 로 정규화하여
 * 상위(쿼리/뮤테이션)에서 일관되게 사용자에게 노출할 수 있게 한다.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Partial<ResultResponse>>) => {
    const message =
      error.response?.data?.message ?? error.message ?? DEFAULT_ERROR_MESSAGE;
    return Promise.reject(new Error(message));
  },
);

import { apiClient } from "@/api/client";
import type {
  AttendanceCheckInRequest,
  AttendanceResponse,
  UpdateResponse,
} from "@/types/api";

const BASE = "/v1/attendances";

export async function getAttendances(): Promise<AttendanceResponse[]> {
  const { data } = await apiClient.get<AttendanceResponse[]>(BASE);
  return data;
}

export async function getAttendancesByDate(
  workDate: string, // yyyy-MM-dd
): Promise<AttendanceResponse[]> {
  const { data } = await apiClient.get<AttendanceResponse[]>(
    `${BASE}/date/${workDate}`,
  );
  return data;
}

export async function checkIn(
  body: AttendanceCheckInRequest,
): Promise<UpdateResponse> {
  const { data } = await apiClient.post<UpdateResponse>(
    `${BASE}/check-in`,
    body,
  );
  return data;
}

/**
 * 퇴근 등록. 백엔드 계약상 checkOut 은 쿼리 파라미터(HH:mm)로 전달한다.
 * PATCH /v1/attendances/{id}/check-out?checkOut=18:00
 */
export async function checkOut(
  id: number,
  checkOutTime: string, // HH:mm
): Promise<UpdateResponse> {
  const { data } = await apiClient.patch<UpdateResponse>(
    `${BASE}/${id}/check-out`,
    null,
    { params: { checkOut: checkOutTime } },
  );
  return data;
}

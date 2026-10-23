import { apiClient } from "@/api/client";
import type {
  LeaveRequest,
  LeaveRequestCreateRequest,
  UpdateResponse,
} from "@/types/api";

const BASE = "/v1/leaves";

export async function getLeaves(): Promise<LeaveRequest[]> {
  const { data } = await apiClient.get<LeaveRequest[]>(BASE);
  return data;
}

export async function getLeave(id: number): Promise<LeaveRequest> {
  const { data } = await apiClient.get<LeaveRequest>(`${BASE}/${id}`);
  return data;
}

export async function getLeavesByEmployee(
  employeeId: number,
): Promise<LeaveRequest[]> {
  const { data } = await apiClient.get<LeaveRequest[]>(
    `${BASE}/employee/${employeeId}`,
  );
  return data;
}

export async function createLeave(
  body: LeaveRequestCreateRequest,
): Promise<UpdateResponse> {
  const { data } = await apiClient.post<UpdateResponse>(BASE, body);
  return data;
}

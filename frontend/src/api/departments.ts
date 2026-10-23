import { apiClient } from "@/api/client";
import type {
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  UpdateResponse,
} from "@/types/api";

const BASE = "/v1/departments";

export async function getDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>(BASE);
  return data;
}

export async function getDepartment(id: number): Promise<Department> {
  const { data } = await apiClient.get<Department>(`${BASE}/${id}`);
  return data;
}

export async function createDepartment(
  body: DepartmentCreateRequest,
): Promise<UpdateResponse> {
  const { data } = await apiClient.post<UpdateResponse>(BASE, body);
  return data;
}

export async function updateDepartment(
  body: DepartmentUpdateRequest,
): Promise<UpdateResponse> {
  const { data } = await apiClient.put<UpdateResponse>(BASE, body);
  return data;
}

export async function deleteDepartment(id: number): Promise<UpdateResponse> {
  const { data } = await apiClient.delete<UpdateResponse>(`${BASE}/${id}`);
  return data;
}

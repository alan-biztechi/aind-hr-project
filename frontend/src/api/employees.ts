import { apiClient } from "@/api/client";
import type {
  EmployeeCreateRequest,
  EmployeeResponse,
  EmployeeUpdateRequest,
  UpdateResponse,
} from "@/types/api";

const BASE = "/v1/employees";

export async function getEmployees(): Promise<EmployeeResponse[]> {
  const { data } = await apiClient.get<EmployeeResponse[]>(BASE);
  return data;
}

export async function getEmployee(id: number): Promise<EmployeeResponse> {
  const { data } = await apiClient.get<EmployeeResponse>(`${BASE}/${id}`);
  return data;
}

export async function getEmployeesByDepartment(
  departmentId: number,
): Promise<EmployeeResponse[]> {
  const { data } = await apiClient.get<EmployeeResponse[]>(
    `${BASE}/department/${departmentId}`,
  );
  return data;
}

export async function createEmployee(
  body: EmployeeCreateRequest,
): Promise<UpdateResponse> {
  const { data } = await apiClient.post<UpdateResponse>(BASE, body);
  return data;
}

export async function updateEmployee(
  body: EmployeeUpdateRequest,
): Promise<UpdateResponse> {
  const { data } = await apiClient.put<UpdateResponse>(BASE, body);
  return data;
}

export async function deleteEmployee(id: number): Promise<UpdateResponse> {
  const { data } = await apiClient.delete<UpdateResponse>(`${BASE}/${id}`);
  return data;
}

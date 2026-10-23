// 백엔드 DTO에 대응하는 TypeScript 타입.
// 날짜/시간은 백엔드가 JSON 문자열(ISO)로 직렬화하므로 string 으로 수신한다.

// ---------- 공통 응답 ----------
export type SuccessFlag = "SUCCESS" | "FAIL";

export interface ResultResponse {
  success: SuccessFlag;
  message: string;
}

export interface UpdateResponse extends ResultResponse {
  id: number;
}

// ---------- 부서 (Department entity) ----------
export interface Department {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentCreateRequest {
  name: string;
  description?: string;
}

export interface DepartmentUpdateRequest {
  id: number;
  name: string;
  description?: string;
}

// ---------- 직원 (EmployeeResponse — 부서명 포함) ----------
export type EmployeeStatus = "ACTIVE" | "RESIGNED";

export interface EmployeeResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  departmentId: number;
  departmentName: string;
  position: string;
  hireDate: string; // yyyy-MM-dd
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreateRequest {
  name: string;
  email: string;
  phone?: string;
  departmentId: number;
  position: string;
  hireDate: string; // yyyy-MM-dd
}

export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  id: number;
  status: EmployeeStatus;
}

// ---------- 출퇴근 (AttendanceResponse — 직원/부서명 포함) ----------
export type AttendanceStatus = "NORMAL" | "LATE" | "EARLY_LEAVE" | "ABSENT";

export interface AttendanceResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  workDate: string; // yyyy-MM-dd
  checkIn: string | null; // HH:mm:ss
  checkOut: string | null; // HH:mm:ss
  status: AttendanceStatus;
  note: string | null;
  createdAt: string;
}

export interface AttendanceCheckInRequest {
  employeeId: number;
  workDate: string; // yyyy-MM-dd
  checkIn: string; // HH:mm
}

// ---------- 휴가 (LeaveRequest entity) ----------
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

// 백엔드는 한글 유형 문자열을 사용한다 (연차/반차/병가/경조사)
export const LEAVE_TYPES = ["연차", "반차", "병가", "경조사"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  reason: string | null;
  status: LeaveStatus;
  approverId: number | null;
  // 주의: 백엔드 엔티티가 DB의 created_at 컬럼을 requestDate 로 매핑하여 노출한다.
  requestDate: string;
  updatedAt: string;
}

export interface LeaveRequestCreateRequest {
  employeeId: number;
  leaveType: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  reason?: string;
}

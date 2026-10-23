import { useForm } from "react-hook-form";
import type { Department, EmployeeResponse, EmployeeStatus } from "@/types/api";

export interface EmployeeFormValues {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
}

interface EmployeeFormProps {
  initial?: EmployeeResponse;
  departments: Department[];
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel: () => void;
}

export function EmployeeForm({
  initial,
  departments,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      departmentId: initial ? String(initial.departmentId) : "",
      position: initial?.position ?? "",
      hireDate: initial?.hireDate ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && <p className="form-error">{errorMessage}</p>}

      <div className="field">
        <label htmlFor="emp-name">이름 *</label>
        <input
          id="emp-name"
          {...register("name", { required: "이름은 필수입니다." })}
        />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="emp-email">이메일 *</label>
        <input
          id="emp-email"
          type="email"
          {...register("email", {
            required: "이메일은 필수입니다.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "올바른 이메일 형식을 입력하세요.",
            },
          })}
        />
        {errors.email && (
          <span className="field-error">{errors.email.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="emp-phone">전화번호</label>
        <input id="emp-phone" {...register("phone")} />
      </div>

      <div className="field">
        <label htmlFor="emp-dept">부서 *</label>
        <select
          id="emp-dept"
          {...register("departmentId", { required: "부서는 필수입니다." })}
        >
          <option value="">선택하세요</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {errors.departmentId && (
          <span className="field-error">{errors.departmentId.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="emp-position">직급 *</label>
        <input
          id="emp-position"
          placeholder="사원/대리/과장/차장/부장"
          {...register("position", { required: "직급은 필수입니다." })}
        />
        {errors.position && (
          <span className="field-error">{errors.position.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="emp-hire">입사일 *</label>
        <input
          id="emp-hire"
          type="date"
          {...register("hireDate", { required: "입사일은 필수입니다." })}
        />
        {errors.hireDate && (
          <span className="field-error">{errors.hireDate.message}</span>
        )}
      </div>

      {isEdit && (
        <div className="field">
          <label htmlFor="emp-status">상태</label>
          <select id="emp-status" {...register("status")}>
            <option value="ACTIVE">재직</option>
            <option value="RESIGNED">퇴사</option>
          </select>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

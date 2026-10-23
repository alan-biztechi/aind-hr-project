import { useForm } from "react-hook-form";
import type { EmployeeResponse } from "@/types/api";

export interface CheckInFormValues {
  employeeId: string;
  workDate: string;
  checkIn: string;
}

interface CheckInFormProps {
  employees: EmployeeResponse[];
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (values: CheckInFormValues) => void;
  onCancel: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CheckInForm({
  employees,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: CheckInFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckInFormValues>({
    defaultValues: {
      employeeId: "",
      workDate: today(),
      checkIn: "09:00",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && <p className="form-error">{errorMessage}</p>}

      <div className="field">
        <label htmlFor="ci-emp">직원 *</label>
        <select
          id="ci-emp"
          {...register("employeeId", { required: "직원은 필수입니다." })}
        >
          <option value="">선택하세요</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.departmentName})
            </option>
          ))}
        </select>
        {errors.employeeId && (
          <span className="field-error">{errors.employeeId.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="ci-date">근무일 *</label>
        <input
          id="ci-date"
          type="date"
          {...register("workDate", { required: "근무일은 필수입니다." })}
        />
        {errors.workDate && (
          <span className="field-error">{errors.workDate.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="ci-time">출근 시각 *</label>
        <input
          id="ci-time"
          type="time"
          {...register("checkIn", { required: "출근 시각은 필수입니다." })}
        />
        {errors.checkIn && (
          <span className="field-error">{errors.checkIn.message}</span>
        )}
      </div>

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
          {submitting ? "등록 중..." : "출근 등록"}
        </button>
      </div>
    </form>
  );
}

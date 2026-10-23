import { useForm } from "react-hook-form";
import { LEAVE_TYPES } from "@/types/api";
import type { EmployeeResponse } from "@/types/api";

export interface LeaveFormValues {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface LeaveFormProps {
  employees: EmployeeResponse[];
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (values: LeaveFormValues) => void;
  onCancel: () => void;
}

export function LeaveForm({
  employees,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: LeaveFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    defaultValues: {
      employeeId: "",
      leaveType: LEAVE_TYPES[0],
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && <p className="form-error">{errorMessage}</p>}

      <div className="field">
        <label htmlFor="lv-emp">직원 *</label>
        <select
          id="lv-emp"
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
        <label htmlFor="lv-type">휴가 유형 *</label>
        <select
          id="lv-type"
          {...register("leaveType", { required: "휴가 유형은 필수입니다." })}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.leaveType && (
          <span className="field-error">{errors.leaveType.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="lv-start">시작일 *</label>
        <input
          id="lv-start"
          type="date"
          {...register("startDate", { required: "시작일은 필수입니다." })}
        />
        {errors.startDate && (
          <span className="field-error">{errors.startDate.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="lv-end">종료일 *</label>
        <input
          id="lv-end"
          type="date"
          {...register("endDate", {
            required: "종료일은 필수입니다.",
            validate: (value) =>
              !getValues("startDate") ||
              value >= getValues("startDate") ||
              "종료일은 시작일 이후여야 합니다.",
          })}
        />
        {errors.endDate && (
          <span className="field-error">{errors.endDate.message}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="lv-reason">사유</label>
        <textarea
          id="lv-reason"
          rows={3}
          {...register("reason", {
            maxLength: { value: 500, message: "사유는 500자 이내입니다." },
          })}
        />
        {errors.reason && (
          <span className="field-error">{errors.reason.message}</span>
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
          {submitting ? "신청 중..." : "휴가 신청"}
        </button>
      </div>
    </form>
  );
}

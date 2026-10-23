import { useForm } from "react-hook-form";
import type { Department } from "@/types/api";

export interface DepartmentFormValues {
  name: string;
  description: string;
}

interface DepartmentFormProps {
  initial?: Department;
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (values: DepartmentFormValues) => void;
  onCancel: () => void;
}

export function DepartmentForm({
  initial,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && <p className="form-error">{errorMessage}</p>}

      <div className="field">
        <label htmlFor="dept-name">부서명 *</label>
        <input
          id="dept-name"
          {...register("name", { required: "부서명은 필수입니다." })}
        />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="dept-desc">설명</label>
        <textarea id="dept-desc" rows={3} {...register("description")} />
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
          {submitting ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

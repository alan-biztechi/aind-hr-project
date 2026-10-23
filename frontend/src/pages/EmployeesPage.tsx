import { useState } from "react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Spinner } from "@/components/common/Spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  EmployeeForm,
  type EmployeeFormValues,
} from "@/components/forms/EmployeeForm";
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import type { EmployeeResponse } from "@/types/api";

export function EmployeesPage() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const { data, isLoading, isError, error, refetch } = useEmployees(deptFilter);
  const { data: departments } = useDepartments();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deleteMut = useDeleteEmployee();

  const [editing, setEditing] = useState<EmployeeResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<EmployeeResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeResponse | null>(null);
  const [formError, setFormError] = useState<string>();

  const openCreate = () => {
    setEditing(null);
    setFormError(undefined);
    setFormOpen(true);
  };

  const openEdit = (emp: EmployeeResponse) => {
    setEditing(emp);
    setFormError(undefined);
    setFormOpen(true);
  };

  const handleSubmit = (values: EmployeeFormValues) => {
    setFormError(undefined);
    const base = {
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      departmentId: Number(values.departmentId),
      position: values.position,
      hireDate: values.hireDate,
    };
    const onSuccess = () => setFormOpen(false);
    const onError = (e: unknown) =>
      setFormError(e instanceof Error ? e.message : "저장에 실패했습니다.");

    if (editing) {
      updateMut.mutate(
        { id: editing.id, ...base, status: values.status },
        { onSuccess, onError },
      );
    } else {
      createMut.mutate(base, { onSuccess, onError });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const columns: Column<EmployeeResponse>[] = [
    { key: "id", header: "ID", render: (e) => e.id, width: "60px" },
    { key: "name", header: "이름", render: (e) => e.name },
    { key: "department", header: "부서", render: (e) => e.departmentName },
    { key: "position", header: "직급", render: (e) => e.position },
    { key: "email", header: "이메일", render: (e) => e.email },
    {
      key: "status",
      header: "상태",
      render: (e) => <StatusBadge kind="employee" value={e.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "150px",
      render: (e) => (
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e);
            }}
          >
            수정
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={(ev) => {
              ev.stopPropagation();
              setDeleteTarget(e);
            }}
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="직원 관리"
        description="직원을 부서 정보와 함께 조회하고 관리합니다."
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + 직원 등록
          </button>
        }
      />

      <div className="field" style={{ maxWidth: "240px" }}>
        <label htmlFor="dept-filter">부서 필터</label>
        <select
          id="dept-filter"
          value={deptFilter ?? ""}
          onChange={(e) =>
            setDeptFilter(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">전체</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <Spinner />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(e) => e.id}
          onRowClick={(e) => setDetail(e)}
        />
      )}

      {/* 등록/수정 폼 */}
      <Modal
        open={formOpen}
        title={editing ? "직원 수정" : "직원 등록"}
        onClose={() => setFormOpen(false)}
      >
        <EmployeeForm
          initial={editing ?? undefined}
          departments={departments ?? []}
          submitting={createMut.isPending || updateMut.isPending}
          errorMessage={formError}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* 상세 보기 */}
      <Modal
        open={detail !== null}
        title="직원 상세"
        onClose={() => setDetail(null)}
      >
        {detail && (
          <dl style={{ margin: 0, display: "grid", gap: "0.6rem" }}>
            <DetailRow label="이름" value={detail.name} />
            <DetailRow label="이메일" value={detail.email} />
            <DetailRow label="전화번호" value={detail.phone ?? "-"} />
            <DetailRow label="부서" value={detail.departmentName} />
            <DetailRow label="직급" value={detail.position} />
            <DetailRow label="입사일" value={detail.hireDate} />
            <DetailRow
              label="상태"
              value={<StatusBadge kind="employee" value={detail.status} />}
            />
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="직원 삭제"
        message={`'${deleteTarget?.name}' 직원을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: "0.8rem" }}>
      <dt style={{ width: "80px", color: "var(--color-text-muted)", margin: 0 }}>
        {label}
      </dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

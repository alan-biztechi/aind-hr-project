import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Spinner } from "@/components/common/Spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DepartmentForm,
  type DepartmentFormValues,
} from "@/components/forms/DepartmentForm";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/hooks/useDepartments";
import type { Department } from "@/types/api";

export function DepartmentsPage() {
  const { data, isLoading, isError, error, refetch } = useDepartments();
  const createMut = useCreateDepartment();
  const updateMut = useUpdateDepartment();
  const deleteMut = useDeleteDepartment();

  const [editing, setEditing] = useState<Department | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [formError, setFormError] = useState<string>();

  const openCreate = () => {
    setEditing(null);
    setFormError(undefined);
    setFormOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setFormError(undefined);
    setFormOpen(true);
  };

  const handleSubmit = (values: DepartmentFormValues) => {
    setFormError(undefined);
    const payload = {
      name: values.name,
      description: values.description || undefined,
    };
    const onSuccess = () => setFormOpen(false);
    const onError = (e: unknown) =>
      setFormError(e instanceof Error ? e.message : "저장에 실패했습니다.");

    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload }, { onSuccess, onError });
    } else {
      createMut.mutate(payload, { onSuccess, onError });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const columns: Column<Department>[] = [
    { key: "id", header: "ID", render: (d) => d.id, width: "60px" },
    { key: "name", header: "부서명", render: (d) => d.name },
    {
      key: "description",
      header: "설명",
      render: (d) => d.description ?? "-",
    },
    {
      key: "actions",
      header: "",
      width: "150px",
      render: (d) => (
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => openEdit(d)}
          >
            수정
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setDeleteTarget(d)}
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
        title="부서 관리"
        description="부서를 조회하고 등록·수정·삭제합니다."
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + 부서 등록
          </button>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <DataTable columns={columns} rows={data} rowKey={(d) => d.id} />
      )}

      <Modal
        open={formOpen}
        title={editing ? "부서 수정" : "부서 등록"}
        onClose={() => setFormOpen(false)}
      >
        <DepartmentForm
          initial={editing ?? undefined}
          submitting={createMut.isPending || updateMut.isPending}
          errorMessage={formError}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="부서 삭제"
        message={`'${deleteTarget?.name}' 부서를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

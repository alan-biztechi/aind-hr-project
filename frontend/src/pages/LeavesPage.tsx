import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Spinner } from "@/components/common/Spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LeaveForm, type LeaveFormValues } from "@/components/forms/LeaveForm";
import { useCreateLeave, useLeaves } from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import type { LeaveRequest } from "@/types/api";

export function LeavesPage() {
  const [empFilter, setEmpFilter] = useState<number | undefined>();
  const { data, isLoading, isError, error, refetch } = useLeaves(empFilter);
  const { data: employees } = useEmployees();
  const createMut = useCreateLeave();

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string>();

  // LeaveRequest 에는 직원명이 없으므로 직원 목록으로 조인한다.
  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    employees?.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const handleSubmit = (values: LeaveFormValues) => {
    setFormError(undefined);
    createMut.mutate(
      {
        employeeId: Number(values.employeeId),
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason || undefined,
      },
      {
        onSuccess: () => setFormOpen(false),
        onError: (e) =>
          setFormError(e instanceof Error ? e.message : "신청 실패"),
      },
    );
  };

  const columns: Column<LeaveRequest>[] = [
    { key: "id", header: "ID", render: (l) => l.id, width: "60px" },
    {
      key: "employee",
      header: "직원",
      render: (l) => employeeNameById.get(l.employeeId) ?? `#${l.employeeId}`,
    },
    { key: "type", header: "유형", render: (l) => l.leaveType },
    { key: "start", header: "시작일", render: (l) => l.startDate },
    { key: "end", header: "종료일", render: (l) => l.endDate },
    { key: "reason", header: "사유", render: (l) => l.reason ?? "-" },
    {
      key: "status",
      header: "상태",
      render: (l) => <StatusBadge kind="leave" value={l.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="휴가 관리"
        description="휴가 신청을 조회하고 새 휴가를 신청합니다."
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFormError(undefined);
              setFormOpen(true);
            }}
          >
            + 휴가 신청
          </button>
        }
      />

      <div className="field" style={{ maxWidth: "240px" }}>
        <label htmlFor="emp-filter">직원 필터</label>
        <select
          id="emp-filter"
          value={empFilter ?? ""}
          onChange={(e) =>
            setEmpFilter(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">전체</option>
          {employees?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <Spinner />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <DataTable columns={columns} rows={data} rowKey={(l) => l.id} />
      )}

      <Modal open={formOpen} title="휴가 신청" onClose={() => setFormOpen(false)}>
        <LeaveForm
          employees={employees ?? []}
          submitting={createMut.isPending}
          errorMessage={formError}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </>
  );
}

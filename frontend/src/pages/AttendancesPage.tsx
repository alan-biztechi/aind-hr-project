import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Spinner } from "@/components/common/Spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  CheckInForm,
  type CheckInFormValues,
} from "@/components/forms/CheckInForm";
import {
  useAttendances,
  useCheckIn,
  useCheckOut,
} from "@/hooks/useAttendances";
import { useEmployees } from "@/hooks/useEmployees";
import type { AttendanceResponse } from "@/types/api";

function formatTime(value: string | null): string {
  if (!value) return "-";
  // HH:mm:ss -> HH:mm
  return value.slice(0, 5);
}

export function AttendancesPage() {
  const [dateFilter, setDateFilter] = useState<string>("");
  const { data, isLoading, isError, error, refetch } = useAttendances(
    dateFilter || undefined,
  );
  const { data: employees } = useEmployees();
  const checkInMut = useCheckIn();
  const checkOutMut = useCheckOut();

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInError, setCheckInError] = useState<string>();
  const [checkOutTarget, setCheckOutTarget] =
    useState<AttendanceResponse | null>(null);
  const [checkOutTime, setCheckOutTime] = useState("18:00");

  const handleCheckIn = (values: CheckInFormValues) => {
    setCheckInError(undefined);
    checkInMut.mutate(
      {
        employeeId: Number(values.employeeId),
        workDate: values.workDate,
        checkIn: values.checkIn,
      },
      {
        onSuccess: () => setCheckInOpen(false),
        onError: (e) =>
          setCheckInError(e instanceof Error ? e.message : "등록 실패"),
      },
    );
  };

  const handleCheckOut = () => {
    if (!checkOutTarget) return;
    checkOutMut.mutate(
      { id: checkOutTarget.id, checkOutTime },
      { onSuccess: () => setCheckOutTarget(null) },
    );
  };

  const columns: Column<AttendanceResponse>[] = [
    { key: "workDate", header: "근무일", render: (a) => a.workDate },
    { key: "employee", header: "직원", render: (a) => a.employeeName },
    { key: "department", header: "부서", render: (a) => a.departmentName },
    { key: "checkIn", header: "출근", render: (a) => formatTime(a.checkIn) },
    { key: "checkOut", header: "퇴근", render: (a) => formatTime(a.checkOut) },
    {
      key: "status",
      header: "상태",
      render: (a) => <StatusBadge kind="attendance" value={a.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "110px",
      render: (a) =>
        a.checkOut ? null : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setCheckOutTarget(a);
              setCheckOutTime("18:00");
            }}
          >
            퇴근 등록
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="출퇴근 관리"
        description="출퇴근 기록을 조회하고 출근·퇴근을 등록합니다."
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setCheckInError(undefined);
              setCheckInOpen(true);
            }}
          >
            + 출근 등록
          </button>
        }
      />

      <div className="field" style={{ maxWidth: "240px" }}>
        <label htmlFor="date-filter">날짜 필터</label>
        <input
          id="date-filter"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {isLoading && <Spinner />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <DataTable columns={columns} rows={data} rowKey={(a) => a.id} />
      )}

      {/* 출근 등록 */}
      <Modal
        open={checkInOpen}
        title="출근 등록"
        onClose={() => setCheckInOpen(false)}
      >
        <CheckInForm
          employees={employees ?? []}
          submitting={checkInMut.isPending}
          errorMessage={checkInError}
          onSubmit={handleCheckIn}
          onCancel={() => setCheckInOpen(false)}
        />
      </Modal>

      {/* 퇴근 등록 */}
      <Modal
        open={checkOutTarget !== null}
        title="퇴근 등록"
        onClose={() => setCheckOutTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setCheckOutTarget(null)}
              disabled={checkOutMut.isPending}
            >
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCheckOut}
              disabled={checkOutMut.isPending}
            >
              {checkOutMut.isPending ? "등록 중..." : "퇴근 등록"}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          {checkOutTarget?.employeeName} ({checkOutTarget?.workDate})
        </p>
        <div className="field">
          <label htmlFor="co-time">퇴근 시각</label>
          <input
            id="co-time"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
          />
        </div>
        {checkOutMut.isError && (
          <p className="form-error">
            {checkOutMut.error instanceof Error
              ? checkOutMut.error.message
              : "등록에 실패했습니다."}
          </p>
        )}
      </Modal>
    </>
  );
}

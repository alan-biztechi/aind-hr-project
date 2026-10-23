import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendances } from "@/hooks/useAttendances";
import { useLeaves } from "@/hooks/useLeaves";
import styles from "./DashboardPage.module.css";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CardData {
  label: string;
  value: number | undefined;
  loading: boolean;
  to: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const departments = useDepartments();
  const employees = useEmployees();
  const attendancesToday = useAttendances(today());
  const leaves = useLeaves();

  const pendingLeaves = leaves.data?.filter((l) => l.status === "PENDING").length;

  const cards: CardData[] = [
    {
      label: "부서",
      value: departments.data?.length,
      loading: departments.isLoading,
      to: "/departments",
    },
    {
      label: "직원",
      value: employees.data?.length,
      loading: employees.isLoading,
      to: "/employees",
    },
    {
      label: "오늘 출근 기록",
      value: attendancesToday.data?.length,
      loading: attendancesToday.isLoading,
      to: "/attendances",
    },
    {
      label: "대기 중 휴가",
      value: pendingLeaves,
      loading: leaves.isLoading,
      to: "/leaves",
    },
  ];

  return (
    <>
      <PageHeader
        title="대시보드"
        description="인사·근태 현황을 한눈에 확인합니다."
      />
      <div className={styles.grid}>
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            className={styles.card}
            onClick={() => navigate(card.to)}
          >
            <span className={styles.cardLabel}>{card.label}</span>
            <span className={styles.cardValue}>
              {card.loading ? "..." : (card.value ?? "-")}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

import type { CSSProperties } from "react";
import styles from "./StatusBadge.module.css";

type BadgeKind = "attendance" | "leave" | "employee";

interface Palette {
  bg: string;
  text: string;
}

const COLORS: Record<string, Palette> = {
  green: { bg: "#e6f5ea", text: "#1a7f37" },
  orange: { bg: "#fff1e0", text: "#b45309" },
  yellow: { bg: "#fef9c3", text: "#854d0e" },
  gray: { bg: "#eceef1", text: "#57606a" },
  blue: { bg: "#e0ecff", text: "#1d4ed8" },
  red: { bg: "#fde8e8", text: "#b91c1c" },
};

const ATTENDANCE: Record<string, { label: string; color: keyof typeof COLORS }> = {
  NORMAL: { label: "정상", color: "green" },
  LATE: { label: "지각", color: "orange" },
  EARLY_LEAVE: { label: "조퇴", color: "yellow" },
  ABSENT: { label: "결근", color: "gray" },
};

const LEAVE: Record<string, { label: string; color: keyof typeof COLORS }> = {
  PENDING: { label: "대기", color: "blue" },
  APPROVED: { label: "승인", color: "green" },
  REJECTED: { label: "반려", color: "red" },
};

const EMPLOYEE: Record<string, { label: string; color: keyof typeof COLORS }> = {
  ACTIVE: { label: "재직", color: "green" },
  RESIGNED: { label: "퇴사", color: "gray" },
};

interface StatusBadgeProps {
  kind: BadgeKind;
  value: string;
}

export function StatusBadge({ kind, value }: StatusBadgeProps) {
  const map =
    kind === "attendance" ? ATTENDANCE : kind === "leave" ? LEAVE : EMPLOYEE;
  const entry = map[value] ?? { label: value, color: "gray" as const };
  const palette = COLORS[entry.color];

  const style: CSSProperties = {
    backgroundColor: palette.bg,
    color: palette.text,
  };

  return (
    <span className={styles.badge} style={style}>
      {entry.label}
    </span>
  );
}

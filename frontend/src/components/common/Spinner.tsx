import styles from "./Spinner.module.css";

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "불러오는 중..." }: SpinnerProps) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

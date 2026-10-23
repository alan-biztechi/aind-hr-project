import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "알 수 없는 오류가 발생했습니다.";
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.wrap} role="alert">
      <p className={styles.message}>{toMessage(error)}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}

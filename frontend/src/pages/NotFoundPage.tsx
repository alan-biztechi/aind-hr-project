import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "3rem", margin: 0 }}>404</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
        대시보드로 이동
      </Link>
    </div>
  );
}

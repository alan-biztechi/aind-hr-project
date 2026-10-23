import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.4rem",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.5rem" }}>{title}</h1>
        {description && (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

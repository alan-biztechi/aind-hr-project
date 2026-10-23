import { NavLink, Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";

const NAV_ITEMS = [
  { to: "/", label: "대시보드", end: true },
  { to: "/departments", label: "부서" },
  { to: "/employees", label: "직원" },
  { to: "/attendances", label: "출퇴근" },
  { to: "/leaves", label: "휴가" },
];

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>AIND HR</div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

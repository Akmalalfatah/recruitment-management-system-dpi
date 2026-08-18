import { NavLink, useLocation } from "react-router-dom";
import { NAV_BY_ROLE } from "../../lib/navConfig";

export default function Sidebar({ role }) {
  const items = NAV_BY_ROLE[role] || [];
  const location = useLocation();

  return (
    <aside className="w-60 shrink-0 bg-surface-panel border-r border-surface-border min-h-[calc(100vh-64px)] py-4">
      <nav className="flex flex-col gap-0.5 px-3">
        {items.map((item, idx) =>
          item.group ? (
            <div key={idx} className="mt-3 first:mt-0">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                <item.icon size={13} />
                {item.group}
              </div>
              <div className="flex flex-col gap-0.5">
                {item.children.map((child) => (
                  <SidebarLink key={child.path} item={child} />
                ))}
              </div>
            </div>
          ) : (
            <SidebarLink key={item.path} item={item} />
          )
        )}
      </nav>
    </aside>
  );
}

function SidebarLink({ item }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-2.5 pl-6 pr-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-primary text-white font-semibold shadow-card"
            : "text-ink-700 hover:bg-white hover:text-primary"
        }`
      }
    >
      <item.icon size={15} />
      {item.label}
    </NavLink>
  );
}

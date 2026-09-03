import { ROLES } from "./constants";
import {
  LayoutDashboard, FolderCog, FileText, UserPlus, Users, ClipboardList,
  GraduationCap, IdCardIcon, Wallet, Users2, ShieldCheck,
} from "lucide-react";

// Each entry: { label, path, icon, group } OR a group header { group, icon, children:[{label,path}] }
export const NAV_BY_ROLE = {
  [ROLES.OPS]: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      group: "OPS", icon: FolderCog,
      children: [
        { label: "ERS", path: "/ops/ers", icon: FileText },
        { label: "Permintaan Turnover", path: "/ops/turnover", icon: UserPlus },
      ],
    },
  ],
  [ROLES.HR_ER]: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      group: "Employee Relation", icon: Users,
      children: [{ label: "Turnover", path: "/er/turnover", icon: ClipboardList }],
    },
  ],
  [ROLES.HR_RECRUITMENT]: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      group: "Recruitment", icon: UserPlus,
      children: [
        { label: "ERS", path: "/recruitment/ers", icon: FileText },
        { label: "Turnover", path: "/recruitment/turnover", icon: ClipboardList },
        { label: "Interview Harian", path: "/recruitment/interview", icon: Users },
        { label: "Data Peserta Wawancara", path: "/recruitment/peserta", icon: Users2 },
      ],
    },
  ],
  [ROLES.HR_TRAINING]: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      group: "Training", icon: GraduationCap,
      children: [
        { label: "Turnover", path: "/training/turnover", icon: ClipboardList },
        { label: "ID Card", path: "/training/idcard", icon: IdCardIcon },
      ],
    },
  ],
  [ROLES.HR_PAYROLL]: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      group: "Payroll", icon: Wallet,
      children: [{ label: "Turnover", path: "/payroll/turnover", icon: ClipboardList }],
    },
  ],
};

// Super admin sees everything
NAV_BY_ROLE[ROLES.SUPER_ADMIN] = [
  NAV_BY_ROLE[ROLES.OPS][0],
  NAV_BY_ROLE[ROLES.OPS][1],
  NAV_BY_ROLE[ROLES.HR_ER][1],
  NAV_BY_ROLE[ROLES.HR_RECRUITMENT][1],
  NAV_BY_ROLE[ROLES.HR_TRAINING][1],
  NAV_BY_ROLE[ROLES.HR_PAYROLL][1],
  {
    group: "Administrasi", icon: ShieldCheck,
    children: [{ label: "Manajemen User", path: "/admin/users", icon: Users }],
  },
];

export const ROUTE_ACCESS = {
  [ROLES.OPS]: ["/dashboard", "/ops"],
  [ROLES.HR_ER]: ["/dashboard", "/er"],
  [ROLES.HR_RECRUITMENT]: ["/dashboard", "/recruitment"],
  [ROLES.HR_TRAINING]: ["/dashboard", "/training"],
  [ROLES.HR_PAYROLL]: ["/dashboard", "/payroll"],
  [ROLES.SUPER_ADMIN]: ["/dashboard", "/ops", "/er", "/recruitment", "/training", "/payroll", "/admin"],
};

export function canAccess(role, pathname) {
  const allowed = ROUTE_ACCESS[role] || [];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}
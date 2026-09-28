import { useState } from "react";
import PendingCompaniesTab from "./PendingCompaniesTab.jsx";
import UsersTab from "./UsersTab.jsx";
import AuditLogsTab from "./AuditLogsTab.jsx";

const TABS = [
  { id: "pending", label: "Pending companies", Component: PendingCompaniesTab },
  { id: "users", label: "Users", Component: UsersTab },
  { id: "audit", label: "Audit log", Component: AuditLogsTab },
];

export default function AdminDashboard() {
  const [active, setActive] = useState("pending");
  const current = TABS.find((tab) => tab.id === active);
  const Current = current.Component;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Admin dashboard</h1>
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium " +
              (tab.id === active
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <Current />
    </div>
  );
}

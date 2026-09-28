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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Verify companies, review accounts and audit activity.</p>
      </div>
      <div className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            onClick={() => setActive(tab.id)}
            className={
              "whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition " +
              (tab.id === active
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900")
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

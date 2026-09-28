import { useState } from "react";
import { listPendingCompanies, verifyCompany } from "../../api/admin.js";
import { extractErrorMessage } from "../../api/errors.js";
import { useLoad } from "../../hooks/useLoad.js";
import { shortId } from "../../utils/format.js";
import { cardCls, errorBoxCls, primarySmBtnCls, tdCls, thCls } from "../../components/styles.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function PendingCompaniesTab() {
  const { data, error, loading, reload } = useLoad(listPendingCompanies);
  const [verifyingId, setVerifyingId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function handleVerify(company) {
    setActionError("");
    setVerifyingId(company.id);
    try {
      await verifyCompany(company.id);
      reload();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Could not verify company"));
    } finally {
      setVerifyingId(null);
    }
  }

  if (loading && !data) return <Spinner />;
  if (error) return <p className={errorBoxCls}>{error}</p>;

  return (
    <div>
      {actionError && <p className={errorBoxCls + " mb-3"} role="alert">{actionError}</p>}
      <div className={cardCls}>
        {data.length === 0 ? (
          <EmptyState title="All caught up" hint="No companies are waiting for verification." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>Company</th>
                  <th className={thCls}>Website</th>
                  <th className={thCls}>ID</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((company) => (
                  <tr key={company.id} className="transition hover:bg-slate-50/70">
                    <td className={tdCls + " font-medium text-slate-900"}>{company.company_name}</td>
                    <td className={tdCls + " text-slate-600"}>{company.website || "-"}</td>
                    <td className={tdCls + " font-mono text-xs text-slate-500"}>{shortId(company.id)}</td>
                    <td className={tdCls + " text-right"}>
                      <button type="button" className={primarySmBtnCls} disabled={verifyingId === company.id}
                        onClick={() => handleVerify(company)}>
                        {verifyingId === company.id ? "Verifying..." : "Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

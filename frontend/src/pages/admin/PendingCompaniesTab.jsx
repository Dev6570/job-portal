import { useState } from "react";
import { listPendingCompanies, verifyCompany } from "../../api/admin.js";
import { extractErrorMessage } from "../../api/errors.js";
import { useLoad } from "../../hooks/useLoad.js";
import { shortId } from "../../utils/format.js";
import { primaryBtnCls } from "../../components/styles.js";
import Spinner from "../../components/Spinner.jsx";

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
  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  return (
    <div>
      {actionError && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No companies are waiting for verification.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Website</th>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.map((company) => (
                <tr key={company.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{company.company_name}</td>
                  <td className="px-4 py-2">{company.website || "-"}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{shortId(company.id)}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" className={primaryBtnCls} disabled={verifyingId === company.id}
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
  );
}

import { useState } from "react";
import { activateUser, deactivateUser, listUsers } from "../../api/admin.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { extractErrorMessage } from "../../api/errors.js";
import { useLoad } from "../../hooks/useLoad.js";
import { formatDate, shortId } from "../../utils/format.js";
import { cardCls, dangerSmBtnCls, errorBoxCls, primarySmBtnCls, tdCls, thCls } from "../../components/styles.js";
import Badge, { roleTone } from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function UsersTab() {
  const { data, error, loading, reload } = useLoad(listUsers);
  const { user: currentUser } = useAuth();
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function handleToggle(target) {
    setActionError("");
    setActioningId(target.id);
    try {
      if (target.is_active) {
        await deactivateUser(target.id);
      } else {
        await activateUser(target.id);
      }
      reload();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Could not update user status"));
    } finally {
      setActioningId(null);
    }
  }

  if (loading && !data) return <Spinner />;
  if (error) return <p className={errorBoxCls}>{error}</p>;

  return (
    <div>
      {actionError && <p className={errorBoxCls + " mb-3"} role="alert">{actionError}</p>}
      <div className={cardCls}>
        {data.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>Email</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Created</th>
                  <th className={thCls}>ID</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((u) => {
                  const isSelf = currentUser && u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="transition hover:bg-slate-50/70">
                      <td className={tdCls + " font-medium text-slate-900"}>{u.email}</td>
                      <td className={tdCls}><Badge tone={roleTone(u.role)}>{u.role}</Badge></td>
                      <td className={tdCls}>
                        <Badge tone={u.is_active ? "emerald" : "slate"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className={tdCls + " whitespace-nowrap text-slate-600"}>{formatDate(u.created_at)}</td>
                      <td className={tdCls + " font-mono text-xs text-slate-500"}>{shortId(u.id)}</td>
                      <td className={tdCls + " text-right"}>
                        {isSelf ? (
                          <span className="text-xs text-slate-400">That's you</span>
                        ) : (
                          <button
                            type="button"
                            className={u.is_active ? dangerSmBtnCls : primarySmBtnCls}
                            disabled={actioningId === u.id}
                            onClick={() => handleToggle(u)}
                          >
                            {actioningId === u.id
                              ? "Working..."
                              : u.is_active
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

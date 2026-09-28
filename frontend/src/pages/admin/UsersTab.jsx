import { listUsers } from "../../api/admin.js";
import { useLoad } from "../../hooks/useLoad.js";
import { formatDate, shortId } from "../../utils/format.js";
import Spinner from "../../components/Spinner.jsx";

export default function UsersTab() {
  const { data, error, loading } = useLoad(listUsers);

  if (loading && !data) return <Spinner />;
  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Active</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">ID</th>
          </tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <td className="px-4 py-2 font-medium">{u.email}</td>
              <td className="px-4 py-2 capitalize">{u.role}</td>
              <td className="px-4 py-2">{u.is_active ? "Yes" : "No"}</td>
              <td className="px-4 py-2">{formatDate(u.created_at)}</td>
              <td className="px-4 py-2 font-mono text-xs text-slate-500">{shortId(u.id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

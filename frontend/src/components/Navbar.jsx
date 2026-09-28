import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { secondaryBtnCls } from "./styles.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <span className="font-semibold text-indigo-700">Job &amp; Internship Portal</span>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">
              {user.email} <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{user.role}</span>
            </span>
            <button type="button" onClick={handleLogout} className={secondaryBtnCls}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

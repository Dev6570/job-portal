import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { secondaryBtnCls } from "./styles.js";
import Badge, { roleTone } from "./Badge.jsx";
import Logo from "./Logo.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initial = user && user.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            Job &amp; Internship Portal
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700" aria-hidden="true">
                {initial}
              </span>
              <div className="leading-tight">
                <p className="max-w-[14rem] truncate text-sm font-medium text-slate-900">{user.email}</p>
                <Badge tone={roleTone(user.role)}>{user.role}</Badge>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className={secondaryBtnCls}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

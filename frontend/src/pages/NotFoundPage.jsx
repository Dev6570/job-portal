import { Link } from "react-router-dom";
import { primaryBtnCls } from "../components/styles.js";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link className={primaryBtnCls + " mt-6"} to="/">Go home</Link>
    </div>
  );
}

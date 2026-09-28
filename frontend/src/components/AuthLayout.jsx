import Logo from "./Logo.jsx";

const POINTS = [
  "One portal for jobs and internships",
  "Companies are verified before they can post",
  "Role-based access for students, companies and admins",
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <Logo className="h-10 w-10 !bg-white/15 !from-white/20 !to-white/10" />
          <span className="text-lg font-semibold tracking-tight">Job &amp; Internship Portal</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Find the right opportunity, or the right candidate.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-indigo-100">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 flex-none text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-indigo-200">Campus placement management</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo />
            <span className="text-base font-semibold text-slate-900">Job &amp; Internship Portal</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

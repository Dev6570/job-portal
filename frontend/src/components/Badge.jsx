const TONES = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const ROLE_TONES = { admin: "red", company: "sky", student: "emerald" };

export function roleTone(role) {
  return ROLE_TONES[role] || "slate";
}

export default function Badge({ tone = "slate", children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset " +
        (TONES[tone] || TONES.slate) +
        " " +
        className
      }
    >
      {children}
    </span>
  );
}

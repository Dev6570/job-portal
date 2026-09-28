export default function RolePlaceholder({ title }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">{title}</h1>
      <p className="text-sm text-slate-500">This section has not been built yet.</p>
    </div>
  );
}

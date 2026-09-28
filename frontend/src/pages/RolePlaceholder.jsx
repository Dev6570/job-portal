import EmptyState from "../components/EmptyState.jsx";
import { cardCls } from "../components/styles.js";

export default function RolePlaceholder({ title }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <div className={cardCls}>
        <EmptyState title="Coming soon" hint="This section has not been built yet." />
      </div>
    </div>
  );
}

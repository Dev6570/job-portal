import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">Page not found</h1>
      <Link className="text-indigo-600 underline" to="/">Go home</Link>
    </div>
  );
}

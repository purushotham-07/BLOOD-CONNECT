import { getErrorMessage } from '../utils/helpers';

export default function ErrorMessage({ error, fallback }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {getErrorMessage(error, fallback)}
    </div>
  );
}
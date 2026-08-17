import { getErrorMessage } from '../utils/helpers';

export default function ErrorMessage({ error, fallback }) {
  if (!error) return null;
  const message = getErrorMessage(error, fallback);

  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-800 shadow-xs flex items-start gap-2.5 animate-slide-up"
    >
      <span className="shrink-0 text-base leading-none">⚠️</span>
      <div className="flex-1 break-words leading-relaxed">
        {message}
      </div>
    </div>
  );
}
export default function Loading({ label = 'Loading…', height }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-gray-500"
      style={height ? { height } : undefined}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
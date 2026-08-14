export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200/60 bg-white/70 backdrop-blur-xs py-6 text-center text-xs text-gray-500">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-gray-800">BloodConnect</span>
          <span>· Real-time PostGIS Blood Coordination</span>
        </div>
        <p className="text-gray-400">
          © {new Date().getFullYear()} <strong className="text-gray-700 font-semibold">Purushotham Reddy</strong>. Licensed under the <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">MIT License</a>.
        </p>
      </div>
    </footer>
  );
}

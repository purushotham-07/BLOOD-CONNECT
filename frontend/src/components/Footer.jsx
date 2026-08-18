export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white/80 py-2.5 text-center text-[11px] text-gray-400">
      <div className="mx-auto max-w-6xl px-3 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-gray-700">BloodConnect</span>
          <span>· Emergency Blood Network</span>
        </div>
        <p>
          © {new Date().getFullYear()} <strong className="font-semibold text-gray-600">Purushotham Reddy</strong> · <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 transition">MIT License</a>
        </p>
      </div>
    </footer>
  );
}

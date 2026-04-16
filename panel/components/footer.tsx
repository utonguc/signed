export default function Footer({ light = false }: { light?: boolean }) {
  return (
    <footer className={`mt-auto py-4 px-6 text-center text-xs ${light ? "text-white/40" : "text-gray-400"}`}>
      <span className="font-semibold tracking-wide">Signed</span>
      <span className="mx-1.5">·</span>
      <span>
        A product of{" "}
        <span className={`font-semibold ${light ? "text-white/60" : "text-gray-500"}`}>
          xshield
        </span>
      </span>
      <span className="mx-1.5">·</span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}

import Link from "next/link";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/library", label: "Library" },
  { href: "/editor", label: "Editor" },
] as const;

export function AppNav() {
  return (
    <nav aria-label="App navigation">
      <ul className="flex flex-wrap gap-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

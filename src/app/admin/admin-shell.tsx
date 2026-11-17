"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { signOutAction } from "./actions";

const ADMIN_MENU_STORAGE_KEY = "bonmarche-admin-menu-expanded";
const ADMIN_MENU_CHANGE_EVENT = "bonmarche-admin-menu-change";
let menuExpandedSnapshot = false;

function syncMenuPreference(onStoreChange: () => void) {
  try {
    const storedPreference =
      window.localStorage.getItem(ADMIN_MENU_STORAGE_KEY) === "true";
    if (storedPreference !== menuExpandedSnapshot) {
      menuExpandedSnapshot = storedPreference;
      onStoreChange();
    }
  } catch (error) {
    console.error("Não foi possível carregar a preferência do menu.", error);
  }
}

function subscribeToMenuPreference(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === null || event.key === ADMIN_MENU_STORAGE_KEY) {
      syncMenuPreference(onStoreChange);
    }
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(ADMIN_MENU_CHANGE_EVENT, handleLocalChange);
  syncMenuPreference(onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(ADMIN_MENU_CHANGE_EVENT, handleLocalChange);
  };
}

function getMenuPreferenceSnapshot() {
  return menuExpandedSnapshot;
}

function getServerMenuPreferenceSnapshot() {
  return false;
}

function setMenuPreference(expanded: boolean) {
  menuExpandedSnapshot = expanded;

  try {
    window.localStorage.setItem(ADMIN_MENU_STORAGE_KEY, String(expanded));
  } catch (error) {
    console.error("Não foi possível salvar a preferência do menu.", error);
  }

  window.dispatchEvent(new Event(ADMIN_MENU_CHANGE_EVENT));
}

const navigationItems = [
  { label: "Início", href: "/admin", icon: "home" },
  { label: "Produtos", href: "/admin/produtos", icon: "inventory_2" },
  { label: "Categorias", href: "/admin/categorias", icon: "category" },
  {
    label: "Configurações",
    href: "/admin/configuracoes",
    icon: "settings",
  },
] as const;

type MenuIconName = (typeof navigationItems)[number]["icon"];

function MenuIcon({ name }: { name: MenuIconName }) {
  const iconPaths: Record<MenuIconName, ReactNode> = {
    home: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />,
    inventory_2: (
      <path d="M20 2H4C3 2 2 2.9 2 4v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zM15 14H9v-2h6v2zM20 7H4V4h16v3z" />
    ),
    category: (
      <>
        <path d="m12 2-5.5 9h11z" />
        <circle cx="17.5" cy="17.5" r="4.5" />
        <path d="M3 13.5h8v8H3z" />
      </>
    ),
    settings: (
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="currentColor"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const menuExpanded = useSyncExternalStore(
    subscribeToMenuPreference,
    getMenuPreferenceSnapshot,
    getServerMenuPreferenceSnapshot,
  );
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-neutral-50 font-sans text-ink">
      <div className="min-h-screen">
        <header className="flex min-h-[70px] items-center justify-between gap-2 bg-plum-dark px-5 py-4 text-white max-sm:min-h-16 max-sm:px-3.5 max-sm:py-3">
          <div className="flex min-w-0 items-center gap-2 max-[360px]:gap-1">
            <Image
              src="/bonmarche-logo.png"
              alt=""
              width={48}
              height={48}
              priority
              className="block size-12 object-contain max-sm:size-10 max-[360px]:size-[34px]"
            />
            <strong className="whitespace-nowrap font-serif text-base text-white max-[360px]:text-sm">Bonmarché</strong>
            <span className="max-w-[100px] text-xs leading-tight font-bold text-sun uppercase max-sm:max-w-[80px] max-sm:text-[9px] max-[360px]:hidden">Painel administrativo</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 max-sm:gap-1">
            <button
              className="inline-flex min-h-12 min-w-28 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20 active:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun motion-reduce:transition-none max-sm:min-h-11 max-sm:min-w-0 max-sm:gap-1 max-sm:px-2 max-sm:text-xs"
              type="button"
              aria-expanded={menuExpanded}
              aria-controls="admin-navigation"
              aria-label={menuExpanded ? "Recolher menu do painel" : "Expandir menu do painel"}
              onClick={() => setMenuPreference(!menuExpanded)}
            >
              <span className="grid w-4 gap-1" aria-hidden="true">
                <span className="h-0.5 w-4 rounded-sm bg-white" />
                <span className="h-0.5 w-4 rounded-sm bg-white" />
                <span className="h-0.5 w-4 rounded-sm bg-white" />
              </span>
              <span>Menu</span>
            </button>
            <form action={signOutAction}>
              <button className="min-h-12 rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/20 active:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun motion-reduce:transition-none max-sm:min-h-11 max-sm:px-2 max-sm:text-xs" type="submit">
                Sair
              </button>
            </form>
          </div>
        </header>
        <div className={`grid min-h-[calc(100vh-70px)] ${menuExpanded ? "grid-cols-[260px_minmax(0,1fr)]" : "grid-cols-1"} max-sm:min-h-0 max-sm:grid-cols-1`}>
          <nav
            id="admin-navigation"
            className={`${menuExpanded ? "grid" : "hidden"} content-start gap-1.5 border-r border-line bg-white px-4 py-5 max-sm:grid-cols-2 max-sm:border-r-0 max-sm:border-b max-sm:px-3.5 max-sm:py-2.5`}
            aria-label="Navegação do painel"
            aria-hidden={!menuExpanded}
          >
            {navigationItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname.startsWith(`${item.href}/`));

              return (
              <Link
                className={`flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 text-base font-bold no-underline transition-colors hover:bg-plum-soft/70 active:bg-plum-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 motion-reduce:transition-none max-sm:min-h-11 max-sm:px-3 max-sm:py-2.5 max-sm:text-xs ${active ? "bg-plum-soft text-plum-dark" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
                href={item.href}
                key={item.href}
              >
                <MenuIcon name={item.icon} />
                {item.label}
              </Link>
              );
            })}
          </nav>
          <section className="min-w-0 px-[clamp(16px,3vw,36px)] py-6 max-sm:px-3.5 max-sm:py-4">{children}</section>
        </div>
      </div>
    </main>
  );
}

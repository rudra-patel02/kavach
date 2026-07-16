"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  Gauge,
  Loader2,
  LogOut,
  Plus,
  Search,
  Settings,
  UserCircle,
  UserRound,
  X,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { clearStoredAuth, useStoredUser } from "@/lib/auth";
import { globalSearch } from "@/lib/search";
import type { GlobalSearchResult } from "@/types/search";
import NotificationCenter from "./NotificationCenter";

const getStoredRecentActions = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedActions = localStorage.getItem("kavach:recent-actions");
    return storedActions ? (JSON.parse(storedActions) as GlobalSearchResult[]) : [];
  } catch {
    return [];
  }
};

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [recentActions, setRecentActions] = useState<GlobalSearchResult[]>(
    getStoredRecentActions
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useStoredUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return ["Dashboard"];
    }

    return segments.map((segment) =>
      segment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    );
  }, [pathname]);

  useEffect(() => {
    const searchText = query.trim();

    if (searchText.length < 2) {
      return;
    }

    const timer = window.setTimeout(() => {
      globalSearch(searchText)
        .then((response) => {
          setResults(response.results);
          setError(null);
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Search unavailable"
          );
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const handleQueryChange = (value: string) => {
    const searchText = value.trim();

    setQuery(value);
    setIsSearching(searchText.length >= 2);

    if (searchText.length < 2) {
      setResults([]);
      setError(null);
    }
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        searchRef.current &&
        event.target instanceof Node &&
        !searchRef.current.contains(event.target)
      ) {
        setResults([]);
        setIsSearchFocused(false);
      }

      if (
        profileRef.current &&
        event.target instanceof Node &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const recordRecentAction = (result: GlobalSearchResult) => {
    const nextActions = [
      result,
      ...recentActions.filter((action) => action.id !== result.id),
    ].slice(0, 5);

    setRecentActions(nextActions);
    localStorage.setItem("kavach:recent-actions", JSON.stringify(nextActions));
  };

  const handleLogout = async () => {
    const refreshToken =
      typeof window === "undefined" ? null : localStorage.getItem("refreshToken");

    clearStoredAuth();
    setIsProfileOpen(false);
    router.replace("/login");

    try {
      await fetch(apiUrl("/api/auth/logout"), {
        body: JSON.stringify({ refreshToken }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
    } catch {
      // Local auth has already been cleared; logout should not strand the user.
    }
  };

  const displayName = user?.name || user?.email || "Profile";
  const displayRole = user?.role || "Viewer";
  const quickActions = [
    { href: "/machines/add", icon: Plus, label: "Add Machine" },
    { href: "/reports", icon: FileText, label: "Reports" },
    { href: "/dashboard/executive", icon: Gauge, label: "Executive" },
  ];

  return (
    <header className="glass-nav sticky top-0 z-40 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Command Workspace
          </p>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/40 sm:inline-block" />
          <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-emerald-200 sm:inline-block">
            Live Ops
          </span>
        </div>
        <h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">
          {breadcrumbs.at(-1)}
        </h2>

        <div className="mt-1 flex min-w-0 items-center gap-2 truncate text-sm text-slate-400">
          {breadcrumbs.map((breadcrumb, index) => (
            <span key={`${breadcrumb}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? <span className="text-slate-600">/</span> : null}
              <span className={index === breadcrumbs.length - 1 ? "truncate text-slate-200" : "truncate"}>
                {breadcrumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">

        <div ref={searchRef} className="relative order-last w-full sm:order-none sm:w-auto">
          <div className="premium-tile flex items-center rounded-xl px-4 py-2 shadow-inner shadow-black/20 transition-colors focus-within:border-cyan-300/50">

            {isSearching ? (
              <Loader2 size={18} className="animate-spin text-cyan-300" />
            ) : (
              <Search size={18} className="text-slate-400" />
            )}

            <input
              ref={inputRef}
              value={query}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Command palette"
              className="ml-3 min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500 sm:w-72"
            />

            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setIsSearching(false);
                }}
                aria-label="Clear search"
                className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          {(results.length > 0 ||
            error ||
            (isSearchFocused &&
              query.trim().length < 2 &&
              recentActions.length > 0)) ? (
            <div className="premium-card notification-panel-enter absolute right-0 top-12 z-50 w-full overflow-hidden rounded-xl sm:w-[440px]">
              {error ? (
                <div className="px-4 py-3 text-sm text-red-100">{error}</div>
              ) : query.trim().length < 2 && recentActions.length > 0 ? (
                <div className="max-h-96 overflow-y-auto p-2">
                  {recentActions.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        setIsSearchFocused(false);
                      }}
                      className="block rounded-lg px-3 py-3 transition-colors hover:bg-cyan-500/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{result.title}</p>
                        <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-slate-300">
                          Recent
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {result.subtitle}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto p-2">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => {
                        recordRecentAction(result);
                        setQuery("");
                        setResults([]);
                        setIsSearchFocused(false);
                      }}
                      className="block rounded-lg px-3 py-3 transition-colors hover:bg-cyan-500/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{result.title}</p>
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-100">
                          {result.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {result.subtitle}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : null}

        </div>

        <div className="hidden items-center gap-2 2xl:flex">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                title={action.label}
                className="premium-tile flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-all hover:-translate-y-0.5 hover:border-cyan-300/40 hover:text-cyan-100"
              >
                <Icon size={17} />
              </Link>
            );
          })}
        </div>

        <NotificationCenter />

        {user?.activePlantId ? (
          <div className="hidden rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-slate-300 shadow-inner shadow-cyan-300/5 xl:block">
            Plant: <span className="font-semibold text-cyan-200">{user.activePlantId}</span>
          </div>
        ) : null}

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((current) => !current)}
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 text-cyan-300 transition-colors hover:border-cyan-400/20 hover:bg-cyan-400/10"
          >
            <UserCircle size={36} />
            <ChevronDown
              size={16}
              className={`transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isProfileOpen ? (
            <div
              role="menu"
              className="premium-card absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl"
            >
              <div className="border-b border-slate-800 px-4 py-3">
                <p className="truncate font-semibold text-white">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {displayRole}
                </p>
              </div>

              <Link
                href="/settings#profile"
                role="menuitem"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-100"
              >
                <UserRound size={16} />
                Profile
              </Link>

              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-100"
              >
                <Settings size={16} />
                Settings
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 border-t border-slate-800 px-4 py-3 text-left text-sm text-red-100 transition-colors hover:bg-red-500/10"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>

      </div>
      </div>
    </header>
  );
}

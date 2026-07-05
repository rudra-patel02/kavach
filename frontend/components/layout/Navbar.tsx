"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, UserCircle, X } from "lucide-react";
import { globalSearch } from "@/lib/search";
import type { GlobalSearchResult } from "@/types/search";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

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
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  return (
    <header className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8">

      <div>
        <h2 className="text-2xl font-bold text-white">
          Industrial Dashboard
        </h2>

        <p className="text-slate-400 text-sm">
          Real-Time Plant Monitoring
        </p>
      </div>

      <div className="flex items-center gap-6">

        <div ref={searchRef} className="relative">
          <div className="flex items-center bg-slate-900 rounded-xl px-4 py-2">

            {isSearching ? (
              <Loader2 size={18} className="animate-spin text-cyan-300" />
            ) : (
              <Search size={18} className="text-slate-400" />
            )}

            <input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search machine, alert, engineer"
              className="w-72 bg-transparent outline-none ml-3 text-white placeholder:text-slate-500"
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

          {(results.length > 0 || error) && query.trim().length >= 2 ? (
            <div className="absolute right-0 top-12 z-50 w-[440px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/40">
              {error ? (
                <div className="px-4 py-3 text-sm text-red-100">{error}</div>
              ) : (
                <div className="max-h-96 overflow-y-auto p-2">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => {
                        setQuery("");
                        setResults([]);
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

        <NotificationCenter />

        <UserCircle size={36} className="text-cyan-400 cursor-pointer" />

      </div>

    </header>
  );
}

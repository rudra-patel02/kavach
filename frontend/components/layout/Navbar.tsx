"use client";

import { Search, UserCircle } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
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

        <div className="flex items-center bg-slate-900 rounded-xl px-4 py-2">

          <Search size={18} className="text-slate-400" />

          <input
            placeholder="Search..."
            className="bg-transparent outline-none ml-3 text-white"
          />

        </div>

        <NotificationCenter />

        <UserCircle size={36} className="text-cyan-400 cursor-pointer" />

      </div>

    </header>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Search, X, Check, Users, Sparkles, Filter, ShieldCheck, CheckCheck } from "lucide-react";
import { CallerAvatar } from "@/components/callouts/CallerAvatar";

export interface CallerInfo {
  name: string;
  count: number;
  badge?: string;
  avatarUrl?: string;
  xUsername?: string;
  wallet?: string;
}

interface CallerFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCallers: CallerInfo[];
  selectedCallers: string[];
  onToggleCaller: (callerName: string) => void;
  onSelectAll: (callers: string[]) => void;
  onClearAll: () => void;
}

export function CallerFilterModal({
  isOpen,
  onClose,
  allCallers,
  selectedCallers,
  onToggleCaller,
  onSelectAll,
  onClearAll,
}: CallerFilterModalProps) {
  const [search, setSearch] = useState("");

  const filteredCallers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCallers;
    return allCallers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.xUsername && c.xUsername.toLowerCase().includes(q)) ||
        (c.wallet && c.wallet.toLowerCase().includes(q))
    );
  }, [allCallers, search]);

  const whitelistCallers = useMemo(() => {
    return allCallers
      .filter((c) =>
        [
          "slingoor",
          "archelon",
          "croakie",
          "cupseyyyyy",
          "ferre",
          "schoen",
          "netvyxe",
          "ansemconzimp",
          "sapijiju",
          "alonalon",
          "supermandev",
          "shitoshi__",
          "haanz",
          "pnut_deployer",
        ].includes(c.name.toLowerCase()) || c.badge?.includes("Whitelist") || c.count > 0
      )
      .map((c) => c.name);
  }, [allCallers]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Alpha Callers Directory</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold">
                  {allCallers.length} Total
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Filter and track multiple Solana alpha callers simultaneously.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Batch Actions Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-white/10 space-y-3 bg-zinc-50 dark:bg-zinc-900/40 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search callers by username, handle or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono placeholder:text-zinc-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectAll(allCallers.map((c) => c.name))}
                className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3 text-amber-500" />
                <span>Select All ({allCallers.length})</span>
              </button>

              {whitelistCallers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectAll(whitelistCallers)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Top Alpha ({whitelistCallers.length})</span>
                </button>
              )}
            </div>

            {selectedCallers.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline font-bold transition-colors cursor-pointer"
              >
                Clear Selection ({selectedCallers.length})
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Caller Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[48vh] space-y-2">
          {filteredCallers.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 font-mono">
              No callers found matching &quot;{search}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCallers.map((caller) => {
                const isSelected = selectedCallers.some(
                  (sc) => sc.toLowerCase() === caller.name.toLowerCase()
                );
                const isAlpha = ["slingoor", "archelon", "croakie", "cupseyyyyy", "ferre", "schoen", "netvyxe", "ansemconzimp", "sapijiju"].includes(caller.name.toLowerCase());

                return (
                  <div
                    key={caller.name}
                    onClick={() => onToggleCaller(caller.name)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30"
                        : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-white/5 hover:border-amber-500/30 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CallerAvatar
                        avatarUrl={caller.avatarUrl}
                        name={caller.name}
                        size="md"
                        className={isSelected ? "ring-2 ring-amber-400 shadow-amber-500/20" : ""}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-black truncate block ${
                              isSelected ? "text-amber-400" : "text-zinc-900 dark:text-white"
                            }`}
                          >
                            @{caller.name}
                          </span>
                          {isAlpha && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                              ★ Alpha
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                          <span>
                            {caller.count > 0 ? (
                              <strong className="text-amber-400 font-bold">{caller.count} callouts</strong>
                            ) : (
                              <span>Tracked</span>
                            )}
                          </span>
                          {caller.xUsername && (
                            <span className="text-zinc-400 hover:text-sky-400">
                              𝕏 @{caller.xUsername}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-amber-500 text-zinc-950"
                          : "border border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-500 font-mono">
            {selectedCallers.length === 0 ? (
              <span>Showing all callouts</span>
            ) : (
              <span className="text-amber-400 font-bold">
                {selectedCallers.length} {selectedCallers.length === 1 ? "caller" : "callers"} filtered
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95 uppercase"
          >
            Apply Filters ({selectedCallers.length || "All"})
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallerFilterModal;

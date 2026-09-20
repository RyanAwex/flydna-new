import React from "react";

export function ContactListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3 w-full animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md relative overflow-hidden"
        >
          <div className="size-11 rounded-full bg-slate-800/80 shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-3.5 w-28 rounded-md bg-slate-800/80" />
            <div className="h-2.5 w-40 rounded-md bg-slate-800/60" />
          </div>
          <div className="h-2 w-8 rounded bg-slate-800/60 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function MessageStreamSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 w-full animate-pulse">
      <div className="flex items-start gap-3 max-w-[70%]">
        <div className="size-9 rounded-full bg-slate-800/80 shrink-0" />
        <div className="flex flex-col gap-2 p-4 rounded-2xl rounded-tl-sm bg-neutral-900/80 border border-white/10 w-full">
          <div className="h-3 w-24 rounded bg-slate-800/80" />
          <div className="h-3 w-48 rounded bg-slate-800/60" />
          <div className="h-3 w-36 rounded bg-slate-800/60" />
        </div>
      </div>
      <div className="flex items-end gap-3 max-w-[70%] ml-auto">
        <div className="flex flex-col gap-2 p-4 rounded-2xl rounded-tr-sm bg-blue-950/60 border border-blue-400/20 w-full">
          <div className="h-3 w-40 rounded bg-slate-800/80" />
          <div className="h-3 w-28 rounded bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
}

export function TelemetryFeedSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-500/20 backdrop-blur-xl flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="h-3.5 w-32 rounded bg-purple-500/20" />
        <div className="h-3 w-12 rounded bg-slate-800" />
      </div>
      <div className="h-20 rounded-xl bg-slate-950/80 border border-white/10" />
    </div>
  );
}

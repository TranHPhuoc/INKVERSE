import React, { type ReactNode } from "react";
import BG from "@/assets/bgcontact.png";

export default function PolicyShell({
                                      title,
                                      subtitle,
                                      children,
                                    }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header
        className="relative w-full h-56 md:h-64 flex items-center justify-center bg-center bg-cover"
        style={{ backgroundImage: `url(${BG})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-3xl md:text-5xl font-semibold text-white drop-shadow">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">{subtitle}</p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <article
          className="space-y-6 leading-relaxed [text-align:justify] text-zinc-700"
        >
          {children}
        </article>
      </main>
    </div>
  );
}

// src/components/layout/AppShell.tsx
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      {/* gradient từ header đổ xuống */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-[#0f172a]/90 via-[#0f172a]/40 to-transparent" />
      <main className="mx-auto max-w-[1152px] md:max-w-[1280px] xl:max-w-[1550px] px-3 sm:px-6">
        {children}
      </main>
      <div className="h-16" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}

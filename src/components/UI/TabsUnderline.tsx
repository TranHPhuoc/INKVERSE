// src/components/ui/TabsUnderline.tsx
type Tab = { id: string; label: string };
export function TabsUnderline({ tabs, active, onChange }:{tabs:Tab[];active:string;onChange:(id:string)=>void}) {
  return (
    <div className="flex gap-6 overflow-x-auto no-scrollbar border-b">
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`py-3 text-sm md:text-base whitespace-nowrap transition-colors
              ${isActive ? "text-neutral-900" : "text-neutral-500"}
              relative`}
          >
            <span>{t.label}</span>
            <span className={`absolute left-0 -bottom-px h-[2px] transition-all
              ${isActive ? "w-full bg-neutral-900" : "w-0 bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";

type Props = { className?: string };

export default function SearchBox({ className = "" }: Props) {
  const [kw, setKw] = useState("");
  const navigate = useNavigate();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = kw.trim();
    if (!q) return;
    navigate({
      pathname: "/search",
      search: `?${createSearchParams({
        q,
        page: "0",
        size: "20",
        sort: "createdAt",
        direction: "DESC",
      })}`,
    });
  };

  return (
    <form onSubmit={submit} className={`flex items-center gap-2 ${className}`}>
      <input
        value={kw}
        onChange={(e) => setKw(e.target.value)}
        placeholder="Tìm kiếm"
        className="h-10 flex-1 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 md:h-11"
      />
      <button
        type="submit"
        className="h-10 cursor-pointer rounded-lg bg-[#db4444] px-4 text-sm font-medium text-white hover:opacity-90 md:h-11"
      >
        Tìm kiếm
      </button>
    </form>
  );
}

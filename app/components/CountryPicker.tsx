"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { COUNTRIES, countryFlag } from "@/lib/countries";

export default function CountryPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("country") ?? "";

  function handleChange(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (code) params.set("country", code);
    else params.delete("country");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-full border border-chalk/15 bg-pitch/50 px-3 py-1.5">
      <span className="text-sm">{current ? countryFlag(current) : "🌐"}</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent font-mono text-xs text-chalk/60 outline-none [&>option]:bg-pitch [&>option]:text-chalk"
      >
        <option value="">Add your country</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

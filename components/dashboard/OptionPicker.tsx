"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";

export function OptionPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const allOptions = Array.from(new Set([...options, ...selected]));

  function toggle(value: string) {
    if (selected.includes(value)) {
      const next = selected.filter((v) => v !== value);
      onChange(next.length > 0 ? next : [...options]);
      return;
    }
    onChange([...selected, value]);
  }

  function addCustom() {
    const value = custom.trim();
    if (!value || selected.includes(value)) return;
    onChange([...selected, value]);
    setCustom("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <button type="button" className="text-xs font-semibold text-emerald-600" onClick={() => onChange([...options])}>
          Reset defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              selected.includes(opt)
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={`${inputClass} flex-1`}
          placeholder={`Add custom ${label.toLowerCase()}...`}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" onClick={addCustom}>
          Add
        </button>
      </div>
    </div>
  );
}

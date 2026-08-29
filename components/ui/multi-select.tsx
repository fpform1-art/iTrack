"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export interface MultiSelectOption {
  value: string;
  label?: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: (string | MultiSelectOption)[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const normalized: MultiSelectOption[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  }

  const selectedLabel = (v: string) => normalized.find((o) => o.value === v)?.label ?? v;
  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
      ? selectedLabel(selected[0])
      : `${selected.length} ${label}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium sm:text-sm",
          selected.length > 0
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        )}
      >
        {buttonLabel}
        <span className="text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-64 w-56 max-w-[85vw] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {normalized.length === 0 ? (
            <p className="px-2 py-1 text-xs text-slate-400">No options yet</p>
          ) : (
            normalized.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {opt.label}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

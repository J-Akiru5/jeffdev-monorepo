"use client";

import * as React from "react";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "./utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  color?: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = "Select option...",
      label,
      error,
      disabled = false,
      className,
      buttonClassName,
      optionsClassName,
    },
    ref
  ) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className={cn("w-full space-y-1.5", className)} ref={ref}>
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50">
            {label}
          </label>
        )}
        <div className="relative">
          <Listbox value={value} onChange={onChange} disabled={disabled}>
            {({ open }) => (
              <>
                <ListboxButton
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left font-mono text-sm text-white shadow-sm transition-all hover:border-white/15 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50",
                    open && "border-cyan-500/50 ring-1 ring-cyan-500/50",
                    buttonClassName
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                      <span className="flex-shrink-0 text-text-muted">
                        {selectedOption.icon}
                      </span>
                    )}
                    <span className="truncate">
                      {selectedOption ? selectedOption.label : placeholder}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-white/40 transition-transform duration-200",
                      open && "rotate-180 text-cyan-400"
                    )}
                  />
                </ListboxButton>

                <ListboxOptions
                  transition
                  className={cn(
                    "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/10 bg-surface p-1 text-base shadow-xl backdrop-blur-md transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 sm:text-sm",
                    optionsClassName
                  )}
                >
                  {options.map((opt) => (
                    <ListboxOption
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      className={({ active, selected, disabled: optDisabled }) =>
                        cn(
                          "relative cursor-pointer select-none rounded-sm py-2 pl-9 pr-4 font-mono text-sm transition-all",
                          active
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "text-white/70",
                          selected && "text-white font-medium",
                          optDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-white/70"
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <div className="flex items-center gap-2 truncate">
                            {opt.icon && (
                              <span className="flex-shrink-0">{opt.icon}</span>
                            )}
                            <span className="truncate">{opt.label}</span>
                          </div>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-cyan-400">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </>
            )}
          </Listbox>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

'use client';

/**
 * Status Filter Component
 * ------------------------
 * Dropdown filter for status fields.
 */

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function StatusFilter({
  value,
  onChange,
  options,
  placeholder = 'All Statuses',
}: StatusFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/20"
    >
      <option value="" className="bg-[#0a0a0a]">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#0a0a0a]">
          {option.label}
        </option>
      ))}
    </select>
  );
}

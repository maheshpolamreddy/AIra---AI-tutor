import { Search } from 'lucide-react';
import { subjectIcon } from '../theme/subjectColors';

const CATEGORIES = [
  'For You',
  'Mathematics',
  'Science',
  'English',
  'Social Science',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Hindi',
] as const;

type FilterPillsProps = {
  active: string;
  onChange: (cat: string) => void;
};

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
      {CATEGORIES.map((cat) => {
        const Icon = subjectIcon(cat);
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: isActive ? 'var(--dash-surface-ink)' : 'var(--dash-surface-0)',
              color: isActive ? 'var(--dash-text-inv)' : 'var(--dash-text-2)',
              borderColor: isActive ? 'var(--dash-surface-ink)' : 'var(--dash-border)',
              boxShadow: isActive ? 'var(--dash-shadow-1)' : undefined,
              transitionDuration: 'var(--dash-hover-ms)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--dash-surface-1)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--dash-surface-0)';
            }}
          >
            <Icon className="w-3.5 h-3.5 opacity-80" />
            {cat}
          </button>
        );
      })}
    </div>
  );
}

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full sm:w-72">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: 'var(--dash-text-3)' }}
      />
      <input
        type="search"
        placeholder="Search topics…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none transition-shadow"
        style={{
          background: 'var(--dash-surface-0)',
          borderColor: 'var(--dash-border)',
          color: 'var(--dash-text)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--dash-brand)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--dash-brand-soft)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--dash-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

export { CATEGORIES };

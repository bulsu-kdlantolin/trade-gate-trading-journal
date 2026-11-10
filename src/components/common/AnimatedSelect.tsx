import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface AnimatedSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  prefix?: React.ReactNode;
}

export function AnimatedSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  dropdownClassName = '',
  size = 'sm',
  prefix,
}: AnimatedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation, Arrow cycling & Typeahead
  useEffect(() => {
    let keyBuffer = '';
    let keyBufferTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') {
          setIsOpen(false);
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const nextIndex = (currentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const prevIndex = (currentIndex - 1 + options.length) % options.length;
          onChange(options[prevIndex].value);
          return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          clearTimeout(keyBufferTimeout);
          keyBuffer += e.key.toLowerCase();
          keyBufferTimeout = setTimeout(() => {
            keyBuffer = '';
          }, 500);

          const match = options.find((opt) =>
            opt.label.toLowerCase().startsWith(keyBuffer)
          );
          if (match) {
            onChange(match.value);
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    clearTimeout(keyBufferTimeout);
  };
}, [isOpen, options, value, onChange]);

const selectedOption = options.find((opt) => opt.value === value);

const sizeClasses =
  size === 'sm'
    ? 'px-3 py-1.5 text-xs rounded-xl gap-2'
    : 'px-3.5 py-2 text-xs rounded-xl gap-2.5';

return (
  <div className="relative inline-block text-left" ref={containerRef}>
    {/* Trigger Button */}
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      className={`flex items-center justify-between bg-canvas border border-border hover:border-brand/40 text-text-primary transition-all duration-150 select-none ${sizeClasses} ${isOpen ? 'border-brand/60 ring-2 ring-brand/15 shadow-xs' : ''
        } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 truncate">
        {prefix && <span className="text-text-muted shrink-0">{prefix}</span>}
        {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
        <span className="truncate font-medium">
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </span>
        {selectedOption?.badge && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-card border border-border text-text-secondary">
            {selectedOption.badge}
          </span>
        )}
      </div>

      {/* Rotating Chevron */}
      <ChevronDown
        className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180 text-brand' : ''
          }`}
      />
    </button>

    {/* Animated Dropdown Menu */}
    {isOpen && (
      <div
        role="listbox"
        className={`absolute left-0 mt-1.5 min-w-[180px] max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 animate-dropdown backdrop-blur-md ${dropdownClassName}`}
      >
        <div className="space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-100 ${isSelected
                    ? 'bg-brand/15 text-brand font-bold shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card-hover'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {opt.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-canvas border border-border text-text-muted">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    )}
  </div>
);
}


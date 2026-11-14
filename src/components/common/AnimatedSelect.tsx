import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { playMicroTick } from '../../utils/audioTelemetry';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  triggerLabel?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface AnimatedSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  prefix?: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function AnimatedSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  containerClassName = '',
  dropdownClassName = '',
  size = 'sm',
  prefix,
  ariaLabel,
  ariaLabelledBy,
}: AnimatedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

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

      if (e.key === 'Escape' || e.key === 'Tab') {
        setIsOpen(false);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
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

      if (e.key === 'Home') {
        e.preventDefault();
        if (options.length > 0) onChange(options[0].value);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        if (options.length > 0) onChange(options[options.length - 1].value);
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

  const isFullWidth = className.includes('w-full') || containerClassName.includes('w-full');

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded-xl gap-2'
      : 'px-3.5 py-2 text-xs rounded-xl gap-2.5';

  return (
    <div
      className={`relative ${isFullWidth ? 'w-full block max-w-full min-w-0' : 'inline-block'} text-left ${containerClassName}`}
      ref={containerRef}
    >
      {/* Trigger Button */}
      <button
        id={`${selectId}-btn`}
        type="button"
        onClick={() => {
          playMicroTick();
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? selectId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={`flex items-center justify-between bg-canvas border border-border hover:border-brand/40 text-text-primary transition-all duration-150 select-none max-w-full overflow-hidden ${sizeClasses} ${isOpen ? 'border-brand shadow-xs' : ''
          } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {prefix && <span className="text-text-muted shrink-0">{prefix}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate font-medium text-left">
            {selectedOption ? (selectedOption.triggerLabel || selectedOption.label) : placeholder || 'Select...'}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-card border border-border text-text-secondary shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        {/* Rotating Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200 ease-out ml-1.5 ${isOpen ? 'rotate-180 text-brand' : ''
            }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div
          id={selectId}
          role="listbox"
          aria-labelledby={`${selectId}-btn`}
          className={`absolute ${dropdownClassName.includes('right-') || dropdownClassName.includes('left-') ? '' : 'left-0'
            } mt-1.5 ${dropdownClassName.includes('min-w-') || dropdownClassName.includes('w-') ? '' : 'min-w-[180px]'
            } max-w-[calc(100vw-2rem)] sm:max-w-md max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 animate-dropdown backdrop-blur-md ${dropdownClassName}`}
        >
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  id={`${selectId}-opt-${String(opt.value)}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    playMicroTick();
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-100 min-w-0 ${isSelected
                      ? 'bg-brand/15 text-text-primary dark:text-brand font-bold shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-card-hover'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate text-left" title={opt.label}>{opt.label}</span>
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
        </div >
      )
      }
    </div >
  );
}


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DateRangeState } from '../../types/trade';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { playMicroTick, playCalendarDayClick } from '../../utils/audioTelemetry';

export interface CustomDateRangePickerProps {
  value: DateRangeState;
  onChange: (range: DateRangeState) => void;
  className?: string;
  align?: 'left' | 'right';
  defaultOpen?: boolean;
}

function parseISODate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseISODate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRangeSummary(startStr: string, endStr: string): string {
  if (!startStr && !endStr) return 'Select range';
  if (startStr === endStr) return formatDisplayDate(startStr);

  const start = parseISODate(startStr);
  const end = parseISODate(endStr);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = start.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    const startPart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endPart = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startPart} – ${endPart}, ${start.getFullYear()}`;
  }

  return `${formatDisplayDate(startStr)} – ${formatDisplayDate(endStr)}`;
}

function calculateDaysBetween(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const s = parseISODate(startStr).getTime();
  const e = parseISODate(endStr).getTime();
  const diffMs = Math.abs(e - s);
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

const PRESET_RANGES: {
  id: string;
  label: string;
  getRange: () => DateRangeState;
}[] = [
    {
      id: 'today',
      label: 'Today',
      getRange: () => {
        const now = new Date();
        const s = formatISODate(now);
        return { startDate: s, endDate: s };
      },
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      getRange: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const s = formatISODate(d);
        return { startDate: s, endDate: s };
      },
    },
    {
      id: '7days',
      label: 'Last 7 Days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { startDate: formatISODate(start), endDate: formatISODate(end) };
      },
    },
    {
      id: '14days',
      label: 'Last 14 Days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 13);
        return { startDate: formatISODate(start), endDate: formatISODate(end) };
      },
    },
    {
      id: '30days',
      label: 'Last 30 Days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { startDate: formatISODate(start), endDate: formatISODate(end) };
      },
    },
    {
      id: '90days',
      label: 'Last 90 Days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 89);
        return { startDate: formatISODate(start), endDate: formatISODate(end) };
      },
    },
    {
      id: 'mtd',
      label: 'This Month',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: formatISODate(start), endDate: formatISODate(now) };
      },
    },
    {
      id: 'last_month',
      label: 'Last Month',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: formatISODate(start), endDate: formatISODate(end) };
      },
    },
    {
      id: 'ytd',
      label: 'This Year (YTD)',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return { startDate: formatISODate(start), endDate: formatISODate(now) };
      },
    },
  ];

const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  align = 'right',
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  // Month currently in view
  const [viewDate, setViewDate] = useState<Date>(() => {
    return value.endDate ? parseISODate(value.endDate) : new Date();
  });

  // Range selection transient state
  const [isSelecting, setIsSelecting] = useState(false);
  const [tempStart, setTempStart] = useState<string>(value.startDate);
  const [tempEnd, setTempEnd] = useState<string>(value.endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Manual inputs
  const [manualStart, setManualStart] = useState(value.startDate);
  const [manualEnd, setManualEnd] = useState(value.endDate);

  // Sync state when props change or popover opens
  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    setManualStart(value.startDate);
    setManualEnd(value.endDate);
  }, [value, isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSelecting(false);
        setHoverDate(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsSelecting(false);
        setHoverDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    playMicroTick();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    playMicroTick();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    playMicroTick();
    setViewDate(new Date());
  };

  // Compute active preview range (factoring in hover while selecting)
  const previewRange = useMemo(() => {
    if (isSelecting && hoverDate && tempStart) {
      if (hoverDate < tempStart) {
        return { start: hoverDate, end: tempStart };
      }
      return { start: tempStart, end: hoverDate };
    }
    return {
      start: tempStart <= tempEnd ? tempStart : tempEnd,
      end: tempStart <= tempEnd ? tempEnd : tempStart,
    };
  }, [isSelecting, hoverDate, tempStart, tempEnd]);

  // Generate 42 calendar grid cells (Monday start)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 = Mon, 6 = Sun

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = formatISODate(new Date());

    const cells: {
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dKey = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      cells.push({
        dateKey: dKey,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dKey === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dateKey: dKey,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dKey === todayStr,
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dKey = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dateKey: dKey,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dKey === todayStr,
      });
    }

    return cells;
  }, [year, month]);

  const handleDayClick = (dateKey: string) => {
    if (!isSelecting) {
      // First click: start new range selection
      playMicroTick();
      setTempStart(dateKey);
      setTempEnd(dateKey);
      setManualStart(dateKey);
      setManualEnd(dateKey);
      setIsSelecting(true);
      setHoverDate(null);
    } else {
      // Second click: finalize range
      playCalendarDayClick();
      let finalStart = tempStart;
      let finalEnd = dateKey;

      if (dateKey < tempStart) {
        finalStart = dateKey;
        finalEnd = tempStart;
      }

      setTempStart(finalStart);
      setTempEnd(finalEnd);
      setManualStart(finalStart);
      setManualEnd(finalEnd);
      setIsSelecting(false);
      setHoverDate(null);

      onChange({ startDate: finalStart, endDate: finalEnd });
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_RANGES[number]) => {
    playMicroTick();
    const newRange = preset.getRange();
    setTempStart(newRange.startDate);
    setTempEnd(newRange.endDate);
    setManualStart(newRange.startDate);
    setManualEnd(newRange.endDate);
    setIsSelecting(false);
    setHoverDate(null);

    // Sync view date to the end of range
    setViewDate(parseISODate(newRange.endDate));
    onChange(newRange);
  };

  const handleApplyManual = () => {
    playMicroTick();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(manualStart) || !dateRegex.test(manualEnd)) {
      return;
    }

    let finalStart = manualStart;
    let finalEnd = manualEnd;
    if (manualStart > manualEnd) {
      finalStart = manualEnd;
      finalEnd = manualStart;
    }

    setTempStart(finalStart);
    setTempEnd(finalEnd);
    setIsSelecting(false);
    setHoverDate(null);
    onChange({ startDate: finalStart, endDate: finalEnd });
    setIsOpen(false);
  };

  const handleReset = () => {
    playMicroTick();
    const default30 = PRESET_RANGES.find((p) => p.id === '30days')!.getRange();
    setTempStart(default30.startDate);
    setTempEnd(default30.endDate);
    setManualStart(default30.startDate);
    setManualEnd(default30.endDate);
    setIsSelecting(false);
    setHoverDate(null);
    setViewDate(parseISODate(default30.endDate));
    onChange(default30);
  };

  const daysCount = useMemo(() => {
    return calculateDaysBetween(value.startDate, value.endDate);
  }, [value.startDate, value.endDate]);

  const summaryText = useMemo(() => {
    return formatRangeSummary(value.startDate, value.endDate);
  }, [value.startDate, value.endDate]);

  // Match active preset for indicator badge
  const activePresetId = useMemo(() => {
    const match = PRESET_RANGES.find((p) => {
      const r = p.getRange();
      return r.startDate === value.startDate && r.endDate === value.endDate;
    });
    return match?.id;
  }, [value.startDate, value.endDate]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => {
          playMicroTick();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Filter custom date range"
        className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all inline-flex items-center gap-2.5 select-none active:scale-[0.98] ${isOpen
          ? 'bg-card border-brand text-text-primary shadow-xs ring-1 ring-brand/30'
          : 'bg-canvas border-border text-text-secondary hover:text-text-primary hover:border-brand/40'
          }`}
      >
          <CalendarIcon className="w-4 h-4 text-brand shrink-0" />
        <span className="font-mono text-xs sm:text-sm font-bold text-text-primary tracking-tight">
          {summaryText}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-brand/15 text-text-primary dark:text-brand font-mono text-xs font-bold shrink-0">
          {daysCount}d
        </span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-brand' : ''
                }`}
            />
    </button>

          {/* Custom Cyber/Fintech Date Range Popover */}
          {isOpen && (
            <div
              role="dialog"
              aria-label="Custom Date Range Picker"
          className={`absolute top-full mt-2 z-50 animate-dropdown select-none bg-card border border-border rounded-2xl shadow-2xl p-5 w-[350px] sm:w-[620px] max-w-[95vw] ${align === 'right' ? 'right-0' : 'left-0'
                }`}
            >
              {/* Header Bar */}
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                            <h4 className="text-sm font-bold text-text-primary leading-tight">
                              Performance Date Range
                            </h4>
                              <p className="text-xs text-text-muted leading-tight mt-0.5">
                                Select start & end date to filter metrics
                              </p>
                            </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors"
                          aria-label="Close date picker"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Main 2-Column Responsive Body */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        {/* Left Column: Quick Range Presets */}
                        <div className="sm:col-span-4 border-b sm:border-b-0 sm:border-r border-border pb-3 sm:pb-0 sm:pr-3 space-y-1">
                            <span className="text-xs uppercase font-bold text-text-muted block mb-1.5 px-2 tracking-wider">
                              Quick Presets
                            </span>
                              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 max-h-[160px] sm:max-h-[300px] overflow-y-auto">
                                {PRESET_RANGES.map((preset) => {
                                  const isActive = activePresetId === preset.id;
                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${isActive
                                        ? 'bg-brand text-black font-bold shadow-xs'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-card-hover'
                                        }`}
                                    >
                                      <span>{preset.label}</span>
                                      {isActive && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Column: Interactive Calendar & Month Controls */}
                            <div className="sm:col-span-8 space-y-3">
                              {/* Month Navigation Header */}
                              <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm sm:text-base text-text-primary">
                                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={handleJumpToToday}
                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-canvas border border-border text-text-muted hover:text-brand transition-colors"
                                      >
                                        Today
                                      </button>
                                    </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={handlePrevMonth}
                                          className="p-1.5 rounded-lg hover:bg-card-hover text-text-secondary hover:text-text-primary transition-colors border border-border"
                                          aria-label="Previous month"
                                        >
                                          <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleNextMonth}
                                          className="p-1.5 rounded-lg hover:bg-card-hover text-text-secondary hover:text-text-primary transition-colors border border-border"
                                          aria-label="Next month"
                                        >
                                          <ChevronRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Day Names Header */}
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                      {WEEKDAY_NAMES.map((w) => (
                                        <span
                                          key={w}
                                          className="text-xs font-bold text-text-muted uppercase tracking-wider py-1"
                                        >
                                          {w}
                                        </span>
                                      ))}
                                    </div>

                                    {/* 42-Cell Days Grid */}
                                      <div className="grid grid-cols-7 gap-y-1.5 gap-x-0">
                                        {calendarCells.map((cell) => {
                                          const isStart = cell.dateKey === previewRange.start;
                                          const isEnd = cell.dateKey === previewRange.end;
                                          const isSingle = isStart && isEnd;
                                          const isInRange =
                                            cell.dateKey > previewRange.start && cell.dateKey < previewRange.end;

                                          let cellBgClass = 'hover:bg-card-hover text-text-primary';
                                          let containerBg = 'bg-transparent';

                                          if (isSingle) {
                                            cellBgClass = 'bg-brand text-black font-bold shadow-xs rounded-xl';
                                          } else if (isStart) {
                                            cellBgClass = 'bg-brand text-black font-bold shadow-xs rounded-l-xl';
                                            containerBg = 'bg-brand/15 rounded-l-xl';
                                          } else if (isEnd) {
                                            cellBgClass = 'bg-brand text-black font-bold shadow-xs rounded-r-xl';
                                            containerBg = 'bg-brand/15 rounded-r-xl';
                                          } else if (isInRange) {
                                            cellBgClass = 'text-text-primary dark:text-brand font-semibold';
                                            containerBg = 'bg-brand/15';
                                          }

                                          const opacityClass = cell.isCurrentMonth
                                            ? 'opacity-100'
                                            : 'opacity-30 text-text-muted';

                                          return (
                                            <div
                                              key={cell.dateKey}
                                              className={`relative flex items-center justify-center p-0.5 ${containerBg}`}
                                              onMouseEnter={() => {
                                                if (isSelecting) {
                                                  setHoverDate(cell.dateKey);
                                                }
                                              }}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => handleDayClick(cell.dateKey)}
                        className={`w-9 h-8 sm:w-10 sm:h-9 text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${cellBgClass} ${opacityClass} ${cell.isToday && !isStart && !isEnd && !isInRange
                                                  ? 'rounded-full border-2 border-brand text-text-primary dark:text-brand font-black bg-brand/10 shadow-xs'
                                                  : ''
                                                  }`}
                                              >
                                                {cell.dayNumber}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Manual Direct Inputs Row (Type="text", No system datepicker) */}
                                        <div className="pt-3 border-t border-border flex items-center gap-2.5">
                                          <div className="flex-1">
                                              <label htmlFor="custom-date-start" className="text-xs text-text-muted uppercase font-bold block mb-1">
                                                Start (YYYY-MM-DD)
                                              </label>
                                              <input
                                                id="custom-date-start"
                                                type="text"
                                                inputMode="numeric"
                                                value={manualStart}
                                                onChange={(e) => setManualStart(e.target.value)}
                                                placeholder="2026-01-01"
                                                aria-label="Start date YYYY-MM-DD"
                                                className="w-full bg-canvas border border-border rounded-xl px-3 py-1.5 text-xs sm:text-sm font-mono text-text-primary focus:border-brand"
                                              />
                                          </div>
                                          <div className="text-text-muted pt-5 text-sm font-mono font-bold">→</div>
                                          <div className="flex-1">
                                              <label htmlFor="custom-date-end" className="text-xs text-text-muted uppercase font-bold block mb-1">
                                                End (YYYY-MM-DD)
                                              </label>
                                              <input
                                                id="custom-date-end"
                                                type="text"
                                                inputMode="numeric"
                                                value={manualEnd}
                                                onChange={(e) => setManualEnd(e.target.value)}
                                                placeholder="2026-12-31"
                                                aria-label="End date YYYY-MM-DD"
                                                className="w-full bg-canvas border border-border rounded-xl px-3 py-1.5 text-xs sm:text-sm font-mono text-text-primary focus:border-brand"
                                              />
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bottom Action Footer */}
                                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                                      <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-3 py-1.5 rounded-xl border border-border hover:border-brand/40 text-text-muted hover:text-text-primary text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset (30d)
                                      </button>

                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
                                          {calculateDaysBetween(manualStart, manualEnd)} days
                                        </span>
                                        <button
                                          type="button"
                                          onClick={handleApplyManual}
                                          className="px-4 py-1.5 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          Apply Range
                                        </button>
                                      </div>
                                    </div>
                                </div>
      )}
                              </div>
                              );
};
"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
}

type PresetKey =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

const presets: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "custom", label: "Custom range" },
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getPresetRange(key: PresetKey): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (key) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    }
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: today };
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: today };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: today };
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false;
  const time = date.getTime();
  return time >= from.getTime() && time <= to.getTime();
}

interface CalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedFrom: Date | null;
  selectedTo: Date | null;
  onDateClick: (date: Date) => void;
  hoverDate: Date | null;
  onDateHover: (date: Date | null) => void;
}

function Calendar({
  month,
  onMonthChange,
  selectedFrom,
  selectedTo,
  onDateClick,
  hoverDate,
  onDateHover,
}: CalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const prevMonth = () => {
    onMonthChange(new Date(year, monthIndex - 1, 1));
  };

  const nextMonth = () => {
    onMonthChange(new Date(year, monthIndex + 1, 1));
  };

  const days: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, monthIndex, i));
  }

  // Calculate effective range for highlighting
  const effectiveFrom = selectedFrom;
  const effectiveTo =
    selectedTo || (selectedFrom && hoverDate && hoverDate > selectedFrom ? hoverDate : null);

  return (
    <div className="w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-background-hover text-foreground-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {MONTHS[monthIndex]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-background-hover text-foreground-muted hover:text-foreground"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-foreground-muted py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }

          const isStart = effectiveFrom && isSameDay(date, effectiveFrom);
          const isEnd = effectiveTo && isSameDay(date, effectiveTo);
          const isSelected = isStart || isEnd;
          const isRange = isInRange(date, effectiveFrom, effectiveTo);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              onMouseEnter={() => onDateHover(date)}
              onMouseLeave={() => onDateHover(null)}
              className={`
                h-8 text-sm rounded transition-colors
                ${isSelected ? "bg-green text-background font-medium" : ""}
                ${isRange && !isSelected ? "bg-green/20 text-foreground" : ""}
                ${!isSelected && !isRange ? "hover:bg-background-hover text-foreground" : ""}
                ${isToday && !isSelected ? "ring-1 ring-green/50" : ""}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  });
  const [tempRange, setTempRange] = useState<DateRange>({ from: null, to: null });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset temp range when opening
  useEffect(() => {
    if (isOpen) {
      setTempRange(value);
      setActivePreset(null);
    }
  }, [isOpen, value]);

  const handlePresetClick = (key: PresetKey) => {
    setActivePreset(key);
    if (key !== "custom") {
      const range = getPresetRange(key);
      setTempRange(range);
    }
  };

  const handleDateClick = (date: Date) => {
    setActivePreset("custom");

    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      // Start new selection
      setTempRange({ from: date, to: null });
    } else {
      // Complete selection
      if (date < tempRange.from) {
        setTempRange({ from: date, to: tempRange.from });
      } else {
        setTempRange({ from: tempRange.from, to: date });
      }
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(value);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
    setTempRange({ from: null, to: null });
    setIsOpen(false);
  };

  const displayText =
    value.from && value.to
      ? `${formatDateShort(value.from)} - ${formatDateShort(value.to)}`
      : placeholder;

  const hasValue = value.from !== null || value.to !== null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border
          text-sm transition-colors
          ${hasValue
            ? "border-green/50 bg-green/10 text-foreground"
            : "border-border bg-background-secondary text-foreground-muted hover:text-foreground hover:bg-background-hover"
          }
        `}
      >
        <CalendarIcon className="w-4 h-4" />
        <span>{displayText}</span>
        {hasValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-1 p-0.5 rounded hover:bg-background-hover"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-xl shadow-lg p-4 flex">
          {/* Presets */}
          <div className="w-40 border-r border-border pr-4 mr-4">
            <div className="space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key)}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${activePreset === preset.key
                      ? "bg-green/10 text-green"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-hover"
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendars */}
          <div className="flex gap-6">
            <Calendar
              month={leftMonth}
              onMonthChange={setLeftMonth}
              selectedFrom={tempRange.from}
              selectedTo={tempRange.to}
              onDateClick={handleDateClick}
              hoverDate={hoverDate}
              onDateHover={setHoverDate}
            />
            <Calendar
              month={rightMonth}
              onMonthChange={(m) =>
                setLeftMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              selectedFrom={tempRange.from}
              selectedTo={tempRange.to}
              onDateClick={handleDateClick}
              hoverDate={hoverDate}
              onDateHover={setHoverDate}
            />
          </div>

          {/* Footer */}
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            {tempRange.from && (
              <span className="text-sm text-foreground-muted">
                {formatDateShort(tempRange.from)}
                {tempRange.to && ` - ${formatDateShort(tempRange.to)}`}
              </span>
            )}
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!tempRange.from || !tempRange.to}
              className="px-3 py-1.5 text-sm bg-green text-background rounded-lg hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

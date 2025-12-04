import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAcademicWeek(
  date: number,
  semesterStart: number,
  breaks: { startDate: number; endDate: number }[],
  workdays: number[] = [1, 2, 3, 4, 5]
): number {
  // Align semesterStart to the Monday of that week to ensure Mon-Sun weeks
  const startObj = new Date(semesterStart);
  const day = startObj.getDay();
  const diff = startObj.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startObj.setDate(diff);
  startObj.setHours(0, 0, 0, 0);

  let currentWeekStart = startObj.getTime();
  let academicWeek = 1;
  let safety = 0;

  while (currentWeekStart <= date && safety < 52) {
    const nextWeekStart = currentWeekStart + (7 * 24 * 60 * 60 * 1000);

    // If the event falls in this week, we found it
    if (date < nextWeekStart) {
      return academicWeek;
    }

    // Check if this week is a valid academic week
    let hasWorkDay = false;
    for (let i = 0; i < 7; i++) {
      const checkDate = currentWeekStart + (i * 24 * 60 * 60 * 1000);
      const checkDateObj = new Date(checkDate);

      // Skip if not a workday for the user
      if (!workdays.includes(checkDateObj.getDay())) continue;

      const isBreak = breaks.some(b =>
        checkDate >= b.startDate && checkDate <= b.endDate
      );

      if (!isBreak) {
        hasWorkDay = true;
        break;
      }
    }

    if (hasWorkDay) {
      academicWeek++;
    }

    currentWeekStart = nextWeekStart;
    safety++;
  }

  return Math.max(1, academicWeek);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
  const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
  const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export interface GradeColor {
  min: number;
  color: string;
}

export function getGradeColor(score: number, gradeColors: GradeColor[]): string {
  // Sort by min percentage descending
  const sorted = [...gradeColors].sort((a, b) => b.min - a.min);

  // Find the range the score falls into
  for (let i = 0; i < sorted.length - 1; i++) {
    const upper = sorted[i];
    const lower = sorted[i + 1];

    if (score >= lower.min && score <= upper.min) {
      // Interpolate
      const range = upper.min - lower.min;
      const factor = (score - lower.min) / range;
      return interpolateColor(lower.color, upper.color, factor);
    }
  }

  // If above highest, return highest
  if (score > sorted[0].min) return sorted[0].color;

  // If below lowest, return lowest
  return sorted[sorted.length - 1].color;
}

export interface EventLike {
  id: string;
  date: number;
  recurrenceId?: string | null;
}

export function formatEventTitle(
  title: string,
  currentEvent: EventLike,
  allEvents: EventLike[],
  semesterStart: number | undefined,
  breaks: { startDate: number; endDate: number }[] | undefined,
  workdays: number[] = [1, 2, 3, 4, 5]
): string {
  if (!semesterStart) return title;

  // 1. Replace {week}
  if (title.includes('{week}')) {
    const weekNum = calculateAcademicWeek(currentEvent.date, semesterStart, breaks || [], workdays);
    title = title.replace(/{week}/g, weekNum.toString().padStart(2, '0'));
  }

  // 2. Replace {weekly_index}
  if (title.includes('{weekly_index}')) {
    if (!currentEvent.recurrenceId) {
      title = title.replace(/{weekly_index}/g, "1");
    } else {
      // Find all events in this recurrence series
      const seriesEvents = allEvents.filter(e => e.recurrenceId === currentEvent.recurrenceId);

      // Calculate week for current event
      const currentWeek = calculateAcademicWeek(currentEvent.date, semesterStart, breaks || [], workdays);

      // Find events in the same week
      const weekEvents = seriesEvents.filter(e => {
        const w = calculateAcademicWeek(e.date, semesterStart, breaks || [], workdays);
        return w === currentWeek;
      });

      // Sort by date
      weekEvents.sort((a, b) => a.date - b.date);

      // Find index
      const index = weekEvents.findIndex(e => e.id === currentEvent.id) + 1;

      title = title.replace(/{weekly_index}/g, index.toString());
    }
  }

  return title;
}

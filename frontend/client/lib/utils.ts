// client/lib/utils.ts
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(calendar);
dayjs.extend(relativeTime);
dayjs.extend(utc);

/**
 * Convert Java LocalDateTime array -> JS Date.
 * Example input: [2025, 11, 22, 1, 32, 32, 123456000]
 */
function toDateFromJavaArray(raw: any): Date | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;

  const [year, month, day, hour = 0, minute = 0, second = 0] = raw;

  // JS months are 0-based
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour, minute, second);
}

/**
 * WhatsApp/Facebook-style timestamp formatting.
 */
export function formatChatTimestamp(raw: any): string {
  if (!raw) return "";

  let d: Date | null = null;

  if (Array.isArray(raw)) {
    d = toDateFromJavaArray(raw);
  } else if (typeof raw === "string" || typeof raw === "number") {
    d = new Date(raw);
  }

  if (!d || isNaN(d.getTime())) return "";

  const msgTime = dayjs(d);
  const now = dayjs();

  if (msgTime.isSame(now, "day")) {
    // Today → show only time
    return msgTime.format("hh:mm A"); // e.g. 09:42 PM
  }

  if (msgTime.isSame(now.subtract(1, "day"), "day")) {
    // Yesterday
    return `Yesterday, ${msgTime.format("hh:mm A")}`;
  }

  if (msgTime.isSame(now, "year")) {
    // Same year
    return msgTime.format("DD MMM, hh:mm A"); // 22 Nov, 09:42 PM
  }

  // Older
  return msgTime.format("DD/MM/YYYY, hh:mm A");
}

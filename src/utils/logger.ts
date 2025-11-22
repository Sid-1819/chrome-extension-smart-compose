/**
 * Logger utility that only logs in development mode.
 * In production builds, all logs are silently ignored.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log("[InterviewCoach]", ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info("[InterviewCoach]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[InterviewCoach]", ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error("[InterviewCoach]", ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug("[InterviewCoach]", ...args);
  },
  group: (label: string) => {
    if (isDev) console.group(`[InterviewCoach] ${label}`);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  table: (data: unknown) => {
    if (isDev) console.table(data);
  },
  time: (label: string) => {
    if (isDev) console.time(`[InterviewCoach] ${label}`);
  },
  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(`[InterviewCoach] ${label}`);
  },
};

export default logger;

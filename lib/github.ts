export type Level = 0 | 1 | 2 | 3 | 4;
export type Day = { date: string; count: number; level: Level };
export type Calendar = { total: number; weeks: Day[][]; isSample: boolean };

export const SAMPLE_END = "2026-11-07";

const QUERY =
  "query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}";

const LEVELS: Record<string, Level> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function bad(): never {
  throw new Error("Unexpected GitHub contributions response shape");
}

export function parseGithubCalendar(json: unknown): Calendar {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cal = (json as any)?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal || typeof cal.totalContributions !== "number" || !Array.isArray(cal.weeks)) bad();
  const weeks: Day[][] = cal.weeks.map((w: { contributionDays?: unknown }) => {
    if (!Array.isArray(w?.contributionDays)) bad();
    return w.contributionDays.map(
      (d: { date?: unknown; contributionCount?: unknown; contributionLevel?: unknown }) => {
        const level = LEVELS[String(d?.contributionLevel)];
        if (typeof d?.date !== "string" || typeof d.contributionCount !== "number" || level === undefined) bad();
        return { date: d.date, count: d.contributionCount, level };
      },
    );
  });
  return { total: cal.totalContributions, weeks, isSample: false };
}

function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function levelFor(count: number): Level {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 12) return 3;
  return 4;
}

const DAY_MS = 86_400_000;

/** 53 weeks (Sun..Sat) ending at `endDate`, which must be a Saturday. UTC only. */
export function sampleCalendar(seed: string, endDate: string): Calendar {
  const rand = mulberry32(hashString(seed));
  const end = new Date(endDate + "T00:00:00Z").getTime();
  const start = end - (53 * 7 - 1) * DAY_MS;
  const weeks: Day[][] = [];
  let total = 0;
  for (let w = 0; w < 53; w++) {
    const days: Day[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start + (w * 7 + d) * DAY_MS).toISOString().slice(0, 10);
      const weekend = d === 0 || d === 6;
      const r = rand();
      const burst = rand();
      let count = r < (weekend ? 0.6 : 0.25) ? 0 : Math.floor(burst * burst * (weekend ? 6 : 16)) + 1;
      if (burst > 0.97) count += 10;
      total += count;
      days.push({ date, count, level: levelFor(count) });
    }
    weeks.push(days);
  }
  return { total, weeks, isSample: true };
}

export async function fetchContributions(
  username: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Calendar> {
  if (!token) return sampleCalendar(username, SAMPLE_END);
  try {
    const res = await fetchImpl("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { login: username } }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json?.errors) && json.errors.length) throw new Error("GraphQL errors");
    return parseGithubCalendar(json);
  } catch (err) {
    console.warn(`[github] contributions fetch failed, using sample data: ${(err as Error).message}`);
    return sampleCalendar(username, SAMPLE_END);
  }
}

/** Grid row (0 = Sunday .. 6 = Saturday) for an ISO date, in UTC. */
export function dayRow(date: string): number {
  return new Date(date + "T00:00:00Z").getUTCDay();
}

export type CellPos = { date: string; col: number; row: number };

/** Weekday-aligned position for every day: a partial first week lands on its true rows. */
export function cellPositions(weeks: Calendar["weeks"]): CellPos[] {
  return weeks.flatMap((w, col) => w.map((d) => ({ date: d.date, col, row: dayRow(d.date) })));
}

export function formatDay(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function contributionLabel(count: number, date: string): string {
  return `${count} contribution${count === 1 ? "" : "s"} on ${formatDay(date)}`;
}

/** A label above the first week whose first day is in a new month; skip if < 3 weeks after the previous label. */
export function monthLabels(weeks: Calendar["weeks"]): { week: number; label: string }[] {
  const out: { week: number; label: string }[] = [];
  let prevMonth = "";
  let lastWeek = -Infinity;
  weeks.forEach((w, i) => {
    const first = w[0]?.date;
    if (!first) return;
    const month = first.slice(0, 7);
    if (month === prevMonth) return;
    prevMonth = month;
    if (i - lastWeek < 3) return;
    lastWeek = i;
    out.push({
      week: i,
      label: new Date(first + "T00:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short" }),
    });
  });
  return out;
}

export const SUPPORT_TIME_ZONE = "America/Toronto";
export const SUPPORT_TIME_ZONE_LABEL = "Toronto time (ET)";

const partsFor = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SUPPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

export const displayTorontoDateTime = (value?: string) => value
  ? new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: SUPPORT_TIME_ZONE,
  }).format(new Date(value))
  : "Not confirmed";

export const displayTorontoDate = (value?: string, weekday: "short" | "long" = "short") => value
  ? new Intl.DateTimeFormat("en-CA", {
    weekday,
    month: "short",
    day: "numeric",
    timeZone: SUPPORT_TIME_ZONE,
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`))
  : "No date selected";

export const displayTorontoTime = (value: string) => new Intl.DateTimeFormat("en-CA", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: SUPPORT_TIME_ZONE,
}).format(new Date(value));

/** Formats an instant for a datetime-local input while keeping the wall time in Toronto. */
export const toTorontoDateTimeInput = (value?: string) => {
  const parts = partsFor(value ? new Date(value) : new Date());
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const torontoOffsetAt = (date: Date) => {
  const parts = partsFor(date);
  const representedAsUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return representedAsUTC - Math.floor(date.getTime() / 1000) * 1000;
};

/**
 * Converts a Toronto wall time from a datetime-local input into an ISO instant.
 * Iterating the zone offset handles Toronto's UTC-5/UTC-4 daylight-saving boundary.
 */
export const fromTorontoDateTimeInput = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Enter a valid Toronto date and time.");

  const wallTime = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
  let instant = wallTime;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = wallTime - torontoOffsetAt(new Date(instant));
  }

  const result = new Date(instant);
  if (toTorontoDateTimeInput(result.toISOString()) !== value) {
    throw new Error("That Toronto time does not exist because of daylight saving time. Choose another time.");
  }
  return result.toISOString();
};

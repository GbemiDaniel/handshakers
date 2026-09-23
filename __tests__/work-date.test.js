import { describe, it, expect } from "vitest";
import {
  todayInTeamZone,
  addDaysToDateString,
  formatWorkDate,
  formatWorkDateShort,
} from "@/utils/timeUtils";

// 2026-09-23 10:00 in Lagos (UTC+1)
const MIDMORNING = new Date("2026-09-23T09:00:00Z");

describe("todayInTeamZone", () => {
  it("returns the Lagos calendar date", () => {
    expect(todayInTeamZone(MIDMORNING)).toBe("2026-09-23");
  });

  it("is already the next day in Lagos at 23:30 UTC", () => {
    expect(todayInTeamZone(new Date("2026-09-22T23:30:00Z"))).toBe("2026-09-23");
  });

  it("is still the same day in Lagos at 22:30 UTC", () => {
    expect(todayInTeamZone(new Date("2026-09-22T22:30:00Z"))).toBe("2026-09-22");
  });
});

describe("addDaysToDateString", () => {
  it("steps across month and year boundaries", () => {
    expect(addDaysToDateString("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDaysToDateString("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDateString("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("formatWorkDate", () => {
  it("labels today and yesterday on the team calendar", () => {
    expect(formatWorkDate("2026-09-23", MIDMORNING)).toBe("Today");
    expect(formatWorkDate("2026-09-22", MIDMORNING)).toBe("Yesterday");
  });

  it("uses the Lagos date for 'today' even when UTC is still on the previous day", () => {
    const earlyLagos = new Date("2026-09-22T23:30:00Z"); // 00:30 Sep 23 in Lagos
    expect(formatWorkDate("2026-09-23", earlyLagos)).toBe("Today");
    expect(formatWorkDate("2026-09-22", earlyLagos)).toBe("Yesterday");
  });

  it("spells out older dates without shifting them by timezone", () => {
    expect(formatWorkDate("2026-09-21", MIDMORNING)).toBe("Monday, Sep 21");
  });

  it("handles a missing date", () => {
    expect(formatWorkDate(null, MIDMORNING)).toBe("Unknown Date");
  });
});

describe("formatWorkDateShort", () => {
  it("formats export rows as weekday and dd/mm", () => {
    expect(formatWorkDateShort("2026-09-22")).toBe("Tue 22/09");
  });
});

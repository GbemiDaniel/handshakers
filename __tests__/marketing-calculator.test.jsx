import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import MarketingCalculator from "@/components/MarketingCalculator";

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;
global.IntersectionObserver = MockIntersectionObserver;

// Mock matchMedia for fine-pointer device
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes("pointer: fine"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

function inputs() {
  return {
    yours: screen.getByLabelText(/Your hours/i),
    team: screen.getByLabelText(/Team's total hours/i),
    pool: screen.getByLabelText(/Client's budget cap/i),
  };
}

function fill({ yours, team, pool }) {
  const el = inputs();
  if (yours !== undefined) fireEvent.change(el.yours, { target: { value: yours } });
  if (team !== undefined) fireEvent.change(el.team, { target: { value: team } });
  if (pool !== undefined) fireEvent.change(el.pool, { target: { value: pool } });
}

describe("MarketingCalculator Component (Universal Time Parser)", () => {
  it("starts in a zero state with empty inputs and example placeholders", () => {
    render(<MarketingCalculator />);

    expect(screen.getByRole("heading", { name: /Your Numbers/i })).toBeInTheDocument();

    const { yours, team, pool } = inputs();
    expect(yours).toHaveValue("");
    expect(team).toHaveValue("");
    expect(pool).toHaveValue("");
    expect(yours).toHaveAttribute("placeholder", "e.g., 10:00");
    expect(team).toHaveAttribute("placeholder", "e.g., 50:00");
    expect(pool).toHaveAttribute("placeholder", "e.g., 40:00");

    expect(screen.getByText("Your Share")).toBeInTheDocument();
    expect(screen.getByText("The math")).toBeInTheDocument();
    expect(screen.getByText(/YOU GET PAID FOR/i)).toBeInTheDocument();
    expect(screen.getByText("0.000%")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("(--:-- / --:--) × --:--")).toBeInTheDocument();
  });

  it("calculates pro-rata time accurately from HH:MM inputs", () => {
    render(<MarketingCalculator />);

    // 10:00 / 50:00 = 20.000% share; 20% of 40:00 = 08:00
    fill({ yours: "10:00", team: "50:00", pool: "40:00" });

    expect(screen.getByText("20.000%")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("(10:00 / 50:00) × 40:00")).toBeInTheDocument();
  });

  it("handles mixed HH:MM and decimal input formats seamlessly", () => {
    render(<MarketingCalculator />);

    // 12:45 = 12.75 hrs; 12.75 / 51 = 25.000% share; 25% of 40 = 10:00
    fill({ yours: "12:45", team: "51:00", pool: "40" });

    expect(screen.getByText("25.000%")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("handles pure decimal inputs seamlessly", () => {
    render(<MarketingCalculator />);

    // 15.5 / 62 = 25.000% share; 25% of 40 = 10:00
    fill({ yours: "15.5", team: "62", pool: "40" });

    expect(screen.getByText("25.000%")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("uses the example values for any field left blank", () => {
    render(<MarketingCalculator />);

    // Only "your hours" entered; team and pool fall back to 50:00 and 40:00.
    // 5:00 / 50:00 = 10.000% share; 10% of 40:00 = 04:00
    fill({ yours: "5:00" });

    expect(screen.getByText("10.000%")).toBeInTheDocument();
    expect(screen.getByText("04:00")).toBeInTheDocument();
    expect(screen.getByText("(5:00 / 50:00) × 40:00")).toBeInTheDocument();
  });

  it("safely handles a zero team total without crashing", () => {
    render(<MarketingCalculator />);

    fill({ yours: "10:00", team: "0", pool: "40:00" });

    expect(screen.getByText("0.000%")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("returns to the zero state on Reset", () => {
    render(<MarketingCalculator />);

    fill({ yours: "10:00", team: "50:00", pool: "40:00" });
    expect(screen.getByText("20.000%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));

    expect(inputs().yours).toHaveValue("");
    expect(screen.getByText("0.000%")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });
});

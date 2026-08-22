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

describe("MarketingCalculator Component (Universal Time Parser)", () => {
  it("renders with default HH:MM string inputs and calculates pro-rata time accurately", () => {
    render(<MarketingCalculator />);

    expect(screen.getByRole("heading", { name: /Your Numbers/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Logged Time/i)).toHaveValue("10:00");
    expect(screen.getByLabelText(/Team Total Logged Time/i)).toHaveValue("50:00");
    expect(screen.getByLabelText(/Client \/ Platform Paid Pool/i)).toHaveValue("40:00");

    expect(screen.getByText(/Your Share/i)).toBeInTheDocument();
    expect(screen.getByText(/The Formula/i)).toBeInTheDocument();
    expect(screen.getByText(/YOUR BILLABLE TIME/i)).toBeInTheDocument();

    // 10:00 / 50:00 = 20.000% Share; 20% * 40:00 = 8.000 hrs (08:00)
    expect(screen.getByText("20.000%")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("8.000 hrs")).toBeInTheDocument();
  });

  it("handles mixed HH:MM and decimal input formats seamlessly", () => {
    render(<MarketingCalculator />);

    const yourHoursInput = screen.getByLabelText(/Your Logged Time/i);
    const teamHoursInput = screen.getByLabelText(/Team Total Logged Time/i);
    const platformHoursInput = screen.getByLabelText(/Client \/ Platform Paid Pool/i);

    // Enter 12:45 (12.75 hrs), 51:00 (51.0 hrs), 40 (40.0 hrs)
    // 12.75 / 51 = 25.000% Share; 25% * 40 = 10.000 hrs (10:00)
    fireEvent.change(yourHoursInput, { target: { value: "12:45" } });
    fireEvent.change(teamHoursInput, { target: { value: "51:00" } });
    fireEvent.change(platformHoursInput, { target: { value: "40" } });

    expect(screen.getByText("25.000%")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("10.000 hrs")).toBeInTheDocument();
  });

  it("handles pure decimal inputs seamlessly", () => {
    render(<MarketingCalculator />);

    const yourHoursInput = screen.getByLabelText(/Your Logged Time/i);
    const teamHoursInput = screen.getByLabelText(/Team Total Logged Time/i);
    const platformHoursInput = screen.getByLabelText(/Client \/ Platform Paid Pool/i);

    // Enter 15.5, 62, 40 -> 15.5 / 62 = 25.000% Share; 25% * 40 = 10.000 hrs (10:00)
    fireEvent.change(yourHoursInput, { target: { value: "15.5" } });
    fireEvent.change(teamHoursInput, { target: { value: "62" } });
    fireEvent.change(platformHoursInput, { target: { value: "40" } });

    expect(screen.getByText("25.000%")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("10.000 hrs")).toBeInTheDocument();
  });

  it("safely handles division by zero or empty string without crashing", () => {
    render(<MarketingCalculator />);

    const teamHoursInput = screen.getByLabelText(/Team Total Logged Time/i);
    fireEvent.change(teamHoursInput, { target: { value: "" } });

    expect(screen.getByText("0.000%")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("0.000 hrs")).toBeInTheDocument();
  });
});

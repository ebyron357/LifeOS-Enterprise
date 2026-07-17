import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RevenueRadar } from "@/components/widgets/RevenueRadar";

describe("RevenueRadar", () => {
  it("shows a safe setup state without a connection", () => { render(<RevenueRadar />); expect(screen.getByText("Connect revenue source")).toBeInTheDocument(); });
  it("renders verified Sheet metrics", () => {
    render(<RevenueRadar data={{ connected: true, currentMonthGross: 12500, currentMonthNet: 10000, monthlyTarget: 20000, targetProgress: .5, ytdNet: 42000, last30DaysNet: 10000, updatedAt: "2026-07-17", businesses: [{ name: "ClientVerse", currentMonthNet: 7500, ytdNet: 30000 }] }} />);
    expect(screen.getByText("$10,000")).toBeInTheDocument(); expect(screen.getByText("50%")).toBeInTheDocument(); expect(screen.getByText("ClientVerse")).toBeInTheDocument();
  });
});

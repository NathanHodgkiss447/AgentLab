import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LandingPage from "./page";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("homepage navigation destinations", () => {
  it("links Features to its section and Demo/Docs to implemented routes", () => {
    render(<LandingPage />);
    const navigation = within(screen.getByRole("navigation", { name: "Landing navigation" }));
    expect(navigation.getByRole("link", { name: "Features" }).getAttribute("href")).toBe(
      "#features",
    );
    expect(document.getElementById("features")).not.toBeNull();
    expect(navigation.getByRole("link", { name: "Demo" }).getAttribute("href")).toBe(
      "/dashboard?mode=demo",
    );
    expect(navigation.getByRole("link", { name: "Docs" }).getAttribute("href")).toBe("/docs");
    expect(screen.getByRole("link", { name: "Get started" }).getAttribute("href")).toBe(
      "/dashboard?mode=demo",
    );
  });

  it("uses the configured repository for the GitHub link", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_URL", "https://github.com/NathanHodgkiss447/AgentLab");
    render(<LandingPage />);
    const navigation = within(screen.getByRole("navigation", { name: "Landing navigation" }));
    const github = navigation.getByRole("link", { name: "GitHub" });
    expect(github.getAttribute("href")).toBe("https://github.com/NathanHodgkiss447/AgentLab");
    expect(github.getAttribute("rel")).toBe("noreferrer");
  });
});

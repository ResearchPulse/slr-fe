import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SlrArtifactsHandoffBanner from "./SlrArtifactsHandoffBanner";

const renderBanner = (projectId: string | null, statuses: string[]) => render(
  <MemoryRouter><SlrArtifactsHandoffBanner projectId={projectId} statuses={statuses} /></MemoryRouter>,
);

describe("SlrArtifactsHandoffBanner", () => {
  it("links to the project SLR artifacts once every paper is extracted", () => {
    renderBanner("p1", ["completed", "completed"]);
    expect(screen.getByText("All 2 papers are extracted")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open SLR artifacts/ }).getAttribute("href")).toBe("/projects/p1/synthesis/artifacts");
  });

  it("stays hidden while any paper is unfinished, when there are none, or without a project", () => {
    renderBanner("p1", ["completed", "awaiting-consensus"]);
    expect(screen.queryByRole("link")).toBeNull();
    renderBanner("p1", []);
    expect(screen.queryByRole("link")).toBeNull();
    renderBanner(null, ["completed"]);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

import { describe, expect, test } from "vitest";

import { ElectionStatusPage } from "app/module/election";

import { ElectionProvider, ElectionStatusProvider, ElectionStatusResponse } from "@kiesraad/api";
import { getElectionMockData } from "@kiesraad/api-mocks";
import { overrideOnce, render, screen, within } from "@kiesraad/test";

const renderElectionStatusPage = () =>
  render(
    <ElectionProvider electionId={1}>
      <ElectionStatusProvider electionId={1}>
        <ElectionStatusPage />
      </ElectionStatusProvider>
    </ElectionProvider>,
  );

describe("ElectionStatusPage", () => {
  test("Render status of polling station data entries correctly", async () => {
    overrideOnce("get", "/api/elections/1", 200, getElectionMockData(1));

    overrideOnce("get", "/api/elections/1/status", 200, {
      statuses: [
        {
          polling_station_id: 1,
          status: "first_entry_not_started",
        },
        {
          polling_station_id: 2,
          status: "second_entry_not_started",
          finished_at: new Date().toISOString(),
        },
        {
          polling_station_id: 3,
          status: "first_entry_in_progress",
          first_data_entry_progress: 60,
        },
        {
          polling_station_id: 4,
          status: "first_entry_in_progress",
          first_data_entry_progress: 40,
        },
      ],
    } satisfies ElectionStatusResponse);

    renderElectionStatusPage();

    // Wait for the page to be loaded
    expect(await screen.findByRole("heading", { level: 1, name: "Eerste zitting" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Statusoverzicht steminvoer" }));

    const items = [...screen.getByTestId("polling-stations-per-status").children];
    expect(items[0]).toEqual(screen.getByRole("heading", { level: 3, name: "Stembureaus per status" }));
    expect(items[1]).toHaveTextContent("Fouten en waarschuwingen (0)");
    expect(items[2]).toHaveTextContent("Invoer bezig (2)");
    expect(items[3]).toHaveTextContent("Eerste invoer klaar (1)");
    expect(items[4]).toHaveTextContent("Eerste en tweede invoer klaar (0)");
    expect(items[5]).toHaveTextContent("Werkvoorraad (1)");

    const progress = [...screen.getByTestId("progress").children];
    expect(progress[0]).toEqual(screen.getByRole("heading", { level: 3, name: "Voortgang" }));
    expect(screen.getByTestId("progressbar-all")).toBeInTheDocument();
    const bars = [...screen.getByTestId("multi-outer-bar").children];
    const expectedData = [
      { percentage: 0, class: "definitive" },
      { percentage: 25, class: "first-entry-finished" },
      { percentage: 50, class: "in-progress" },
      { percentage: 0, class: "errors-and-warnings" },
      { percentage: 25, class: "not-started" },
    ];
    bars.forEach((bar, index) => {
      expect(bar.classList, `class for index ${index}`).toContain(`${expectedData[index]?.class}`);
      expect(bar.getAttribute("style"), `style for index ${index}`).toEqual(
        `width: ${expectedData[index]?.percentage}%;`,
      );
    });

    const tablesRoot = screen.getByRole("article");
    expect(within(tablesRoot).getAllByRole("heading", { level: 3 }).length).toBe(3);
    expect(within(tablesRoot).getAllByRole("table").length).toBe(3);

    const tables = [...tablesRoot.children];

    expect(tables[0]).toContain(screen.getByRole("heading", { level: 3, name: "Invoer bezig (2)" }));
    const inProgressTable = within(tables[0] as HTMLElement).getByTestId("in_progress");
    const inProgressRows = within(inProgressTable).getAllByRole("row");
    expect(inProgressRows.length).toBe(3);
    expect(inProgressRows[0]).toHaveTextContent(/Nummer/);
    expect(inProgressRows[0]).toHaveTextContent(/Stembureau/);
    expect(inProgressRows[0]).toHaveTextContent(/Voortgang/);
    expect(inProgressRows[1]).toHaveTextContent(/35/);
    expect(inProgressRows[1]).toHaveTextContent(/Testschool/);
    expect(inProgressRows[1]).toHaveTextContent(/1e invoer/);
    expect(inProgressRows[2]).toHaveTextContent(/36/);
    expect(inProgressRows[2]).toHaveTextContent(/Testbuurthuis/);
    expect(inProgressRows[2]).toHaveTextContent(/1e invoer/);
    expect(within(inProgressRows[2] as HTMLElement).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");

    expect(tables[1]).toContain(screen.getByRole("heading", { level: 3, name: "Eerste invoer klaar (1)" }));
    const firstEntryFinishedTable = within(tables[1] as HTMLElement).getByTestId("first_entry_finished");
    const firstEntryFinishedRows = within(firstEntryFinishedTable).getAllByRole("row");
    expect(firstEntryFinishedRows.length).toBe(2);
    expect(firstEntryFinishedRows[0]).toHaveTextContent(/Nummer/);
    expect(firstEntryFinishedRows[0]).toHaveTextContent(/Stembureau/);
    expect(firstEntryFinishedRows[0]).toHaveTextContent(/Afgerond op/);
    expect(firstEntryFinishedRows[1]).toHaveTextContent(/34/);
    expect(firstEntryFinishedRows[1]).toHaveTextContent(/Testplek/);
    expect(firstEntryFinishedRows[1]).toHaveTextContent(/vandaag/);

    expect(tables[2]).toContain(screen.getByRole("heading", { level: 3, name: "Werkvoorraad (1)" }));
    const notStartedTable = within(tables[2] as HTMLElement).getByTestId("not_started");
    const notStartedRows = within(notStartedTable).getAllByRole("row");
    expect(notStartedRows.length).toBe(2);
    expect(notStartedRows[0]).toHaveTextContent(/Nummer/);
    expect(notStartedRows[0]).toHaveTextContent(/Stembureau/);
    expect(notStartedRows[1]).toHaveTextContent(/33/);
    expect(notStartedRows[1]).toHaveTextContent(/Op Rolletjes/);
  });

  test("Show no polling stations text instead of tables", async () => {
    overrideOnce("get", "/api/elections/1", 200, getElectionMockData(3));

    overrideOnce("get", "/api/elections/1/status", 200, {
      statuses: [],
    });

    renderElectionStatusPage();

    expect(await screen.findByText("Er zijn nog geen stembureaus toegevoegd voor deze verkiezing.")).toBeVisible();
  });

  test("Finish input not visible when data entry is in progress", () => {
    overrideOnce("get", "/api/elections/1", 200, getElectionMockData(1));

    overrideOnce("get", "/api/elections/1/status", 200, {
      statuses: [
        {
          id: 1,
          status: "not_started",
        },
        {
          id: 2,
          status: "not_started",
        },
        {
          id: 3,
          status: "first_entry_unfinished",
        },
        {
          id: 4,
          status: "first_entry_in_progress",
        },
      ],
    });

    renderElectionStatusPage();
    // Test that the data entry finished message doesn't exist
    expect(screen.queryByText("Alle stembureaus zijn twee keer ingevoerd")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invoerfase afronden" })).not.toBeInTheDocument();
  });

  test("Finish input visible when data entry has finished", async () => {
    overrideOnce("get", "/api/elections/1", 200, getElectionMockData(1));

    overrideOnce("get", "/api/elections/1/status", 200, {
      statuses: [
        { id: 1, status: "definitive" },
        { id: 2, status: "definitive" },
      ],
    });

    renderElectionStatusPage();

    // Wait for the page to be loaded
    expect(await screen.findByRole("heading", { level: 1, name: "Eerste zitting" }));

    expect(await screen.findByText("Alle stembureaus zijn twee keer ingevoerd")).toBeVisible();
    expect(screen.getByRole("button", { name: "Invoerfase afronden" })).toBeVisible();
  });

  test("Finish input not visible when election is finished", async () => {
    overrideOnce("get", "/api/elections/1", 200, getElectionMockData(5));
    overrideOnce("get", "/api/elections/1/status", 200, {
      statuses: [
        { id: 1, status: "definitive" },
        { id: 2, status: "definitive" },
      ],
    });

    renderElectionStatusPage();

    // Wait for the page to be loaded
    expect(await screen.findByRole("heading", { level: 1, name: "Eerste zitting" }));

    expect(screen.queryByText("Alle stembureaus zijn twee keer ingevoerd")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invoerfase afronden" })).not.toBeInTheDocument();
  });
});

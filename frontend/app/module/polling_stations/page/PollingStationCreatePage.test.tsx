import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ElectionProvider } from "@kiesraad/api";
import { render } from "@kiesraad/test";

import { PollingStationCreatePage } from "./PollingStationCreatePage";

describe("PollingStationCreatePage", () => {
  test("Shows form", async () => {
    render(
      <ElectionProvider electionId={1}>
        <PollingStationCreatePage />
      </ElectionProvider>,
    );

    const form = await screen.findByTestId("polling-station-form");
    expect(form).toBeVisible();
  });
});

import { expect, test } from "vitest";

import { render, screen } from "app/test/unit";

import { DefaultButton, DisabledButton, EnabledButton } from "./Button.stories";

test("The default button is enabled", () => {
  render(<DefaultButton label="Click me" variant="default" size="md" text="Click me" />);

  const buttonElement = screen.getByRole("button", {
    name: "Click me",
  });

  buttonElement.click();
  expect(buttonElement).toBeEnabled();
});

test("The enabled button is enabled", () => {
  render(<EnabledButton text="Click me!" label="enabled-button" />);

  const buttonElement = screen.getByRole("button", {
    name: "enabled-button",
  });

  expect(buttonElement).toBeEnabled();
});

test("The disabled button is disabled", () => {
  render(<DisabledButton text="Try and click me!" label="disabled-button" disabled={true} />);

  const buttonElement = screen.getByRole("button", {
    name: "disabled-button",
  });

  expect(buttonElement).toBeDisabled();
});

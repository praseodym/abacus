import { expect, test } from "@playwright/test";
import { webcrypto as crypto } from "crypto";

test.describe("authentication", () => {
  test("login happy path", async ({ page, request }) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const random = array.toString();
    const username = `user_${random}`;
    const password = "password_test";
    // create a test user
    const createUserResponse = await request.post("/api/user/development/create", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        username,
        password,
      },
    });
    expect(createUserResponse.status()).toBe(201);

    await page.goto("/account/login");

    await page.getByLabel("Gebruikersnaam").fill(username);
    await page.getByLabel("Wachtwoord").fill(password);
    await page.getByRole("button", { name: "Inloggen" }).click();

    // TODO: use new page object when we know which page to render
    await expect(page.getByRole("alert")).toContainText("Inloggen gelukt");
  });

  test("login unhappy path", async ({ page }) => {
    await page.goto("/account/login");

    await page.getByLabel("Gebruikersnaam").fill("user");
    await page.getByLabel("Wachtwoord").fill("wrong-password");
    await page.getByRole("button", { name: "Inloggen" }).click();

    await expect(page.getByRole("alert")).toContainText("De gebruikersnaam of het wachtwoord is onjuist");
  });
});

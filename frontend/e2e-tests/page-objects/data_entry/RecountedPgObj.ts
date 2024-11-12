import { type Locator, type Page } from "@playwright/test";

import { DataEntryBasePage } from "./DataEntryBasePgObj";

export class RecountedPage extends DataEntryBasePage {
  readonly fieldset: Locator;

  readonly no: Locator;
  readonly next: Locator;
  readonly yes: Locator;

  constructor(page: Page) {
    super(page);

    this.fieldset = page.getByRole("group", {
      name: "Is het selectievakje op de eerste pagina aangevinkt?",
    });

    this.yes = page.getByRole("radio", { name: "Ja, er was een hertelling" });
    this.no = page.getByRole("radio", { name: "Nee, er was geen hertelling" });
    this.next = page.getByRole("button", { name: "Volgende" });
  }

  async checkNoAndClickNext() {
    await this.no.click();
    await this.next.click();
  }

  async checkYesAndClickNext() {
    await this.yes.click();
    await this.next.click();
  }
}

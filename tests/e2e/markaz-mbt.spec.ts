import { test, expect, type Page } from "@playwright/test";
import fc from "fast-check";
import {
  LoginCommand,
  NavigateCommand,
  VerifyMarkazPlaceholderCommand,
} from "./helpers/auth-commands";
import { ROLES } from "./helpers/roles";
import type { Model } from "./helpers/model";

const BASE_URL =
  process.env.TEST_BASE_URL || "https://d2tm9r4awhgiop.cloudfront.net";
const LIVE_PREVIEW_ENABLED = BASE_URL.startsWith("https://");

type MarkazModel = Model & {
  search: string;
};

function initialModel(): MarkazModel {
  return {
    isAuthenticated: false,
    currentPage: null,
    role: null,
    jamatId: null,
    dataVisibility: "none",
    exportVisible: false,
    search: "",
  };
}

async function assertDomMatchesModel(
  model: Readonly<MarkazModel>,
  page: Page,
): Promise<void> {
  if (!model.isAuthenticated || model.currentPage !== "/markaz/data") {
    return;
  }

  await expect(page.getByTestId("markaz-data-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Markaz Data" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Search Markaz data" }),
  ).toHaveValue(model.search);
}

class LoginAndAssertCommand implements fc.AsyncCommand<MarkazModel, Page> {
  check(model: Readonly<MarkazModel>): boolean {
    return !model.isAuthenticated;
  }

  async run(model: MarkazModel, page: Page): Promise<void> {
    await new LoginCommand(
      ROLES.nationalSecretary.email,
      ROLES.nationalSecretary.password,
      ROLES.nationalSecretary.role,
      ROLES.nationalSecretary.jamatId,
      ROLES.nationalSecretary.dataVisibility,
      ROLES.nationalSecretary.exportVisible,
    ).run(model, page);
    await assertDomMatchesModel(model, page);
  }

  toString(): string {
    return "LoginNationalSecretary";
  }
}

class NavigateToMarkazCommand implements fc.AsyncCommand<MarkazModel, Page> {
  check(model: Readonly<MarkazModel>): boolean {
    return model.isAuthenticated && model.currentPage !== "/markaz/data";
  }

  async run(model: MarkazModel, page: Page): Promise<void> {
    await new NavigateCommand("/markaz/data").run(model, page);
    await assertDomMatchesModel(model, page);
  }

  toString(): string {
    return "NavigateToMarkaz";
  }
}

class SearchMarkazCommand implements fc.AsyncCommand<MarkazModel, Page> {
  constructor(private readonly value: string) {}

  check(model: Readonly<MarkazModel>): boolean {
    return model.isAuthenticated && model.currentPage === "/markaz/data";
  }

  async run(model: MarkazModel, page: Page): Promise<void> {
    const input = page.getByRole("textbox", { name: "Search Markaz data" });
    await input.fill(this.value);
    model.search = this.value;
    await assertDomMatchesModel(model, page);
  }

  toString(): string {
    return `SearchMarkaz(${this.value})`;
  }
}

class ClearMarkazSearchCommand implements fc.AsyncCommand<MarkazModel, Page> {
  check(model: Readonly<MarkazModel>): boolean {
    return (
      model.isAuthenticated &&
      model.currentPage === "/markaz/data" &&
      model.search.length > 0
    );
  }

  async run(model: MarkazModel, page: Page): Promise<void> {
    await page.getByRole("button", { name: "Clear Markaz search" }).click();
    model.search = "";
    await assertDomMatchesModel(model, page);
  }

  toString(): string {
    return "ClearMarkazSearch";
  }
}

class VerifyMarkazCommand implements fc.AsyncCommand<MarkazModel, Page> {
  check(model: Readonly<MarkazModel>): boolean {
    return model.isAuthenticated && model.currentPage === "/markaz/data";
  }

  async run(model: MarkazModel, page: Page): Promise<void> {
    await new VerifyMarkazPlaceholderCommand().run(model, page);
    await assertDomMatchesModel(model, page);
  }

  toString(): string {
    return "VerifyMarkaz";
  }
}

test.describe("Markaz search journey MBT", () => {
  test.skip(
    !LIVE_PREVIEW_ENABLED,
    "Set TEST_BASE_URL to the preview reports site to run this journey.",
  );

  test("preserves Markaz page and search invariants across generated commands", async ({
    page,
  }) => {
    const searchValues = fc
      .string({ minLength: 1, maxLength: 32 })
      .filter((value) => value.trim().length > 0);
    const commands = fc.commands(
      [
        fc.constant(new LoginAndAssertCommand()),
        fc.constant(new NavigateToMarkazCommand()),
        fc.constant(new VerifyMarkazCommand()),
        searchValues.map((value) => new SearchMarkazCommand(value)),
        fc.constant(new ClearMarkazSearchCommand()),
      ],
      { maxCommands: 12 },
    );

    await fc.assert(
      fc.asyncProperty(commands, async (generatedCommands) => {
        const journeyPage = await page.context().newPage();
        try {
          await fc.asyncModelRun(
            () => ({ model: initialModel(), real: journeyPage }),
            generatedCommands,
          );
        } finally {
          await journeyPage.close();
        }
      }),
      { numRuns: 3 },
    );
  });
});

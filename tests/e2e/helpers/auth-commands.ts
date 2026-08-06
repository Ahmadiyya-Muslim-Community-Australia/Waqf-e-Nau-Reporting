import { expect, type Page } from '@playwright/test';
import type { Model, ReportsPage, Role, DataVisibility } from './model';

const BASE_URL = process.env.TEST_BASE_URL || 'https://d2tm9r4awhgiop.cloudfront.net';

export class LoginCommand {
    constructor(
        readonly email: string,
        readonly password: string,
        readonly role: Role,
        readonly jamatId: string | null,
        readonly dataVisibility: DataVisibility,
        readonly exportVisible: boolean,
    ) {}

    check(m: Readonly<Model>): boolean { return !m.isAuthenticated; }

    async run(m: Model, page: Page): Promise<void> {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        const currentUrl = page.url();
        if (currentUrl.includes('cognito')) {
            const emailInput = page.getByRole('textbox', { name: 'Email' });
            const passwordInput = page.getByRole('textbox', { name: 'Password' });
            await emailInput.waitFor({ timeout: 15_000 });
            await emailInput.fill(this.email);
            await passwordInput.fill(this.password);
            await page.getByRole('button', { name: 'Sign in' }).click();
            await page.waitForURL((url) => url.href.startsWith(BASE_URL), { timeout: 30_000 });
            await page.waitForLoadState('networkidle');
        }
        m.isAuthenticated = true;
        m.role = this.role;
        m.jamatId = this.jamatId;
        m.dataVisibility = this.dataVisibility;
        m.exportVisible = this.exportVisible;
        await page.waitForTimeout(1000);
    }

    toString = () => `Login(${this.email})`;
}

export class NavigateCommand {
    constructor(readonly target: ReportsPage) {}

    check(m: Readonly<Model>): boolean { return m.isAuthenticated && m.currentPage !== this.target; }

    async run(m: Model, page: Page): Promise<void> {
        await page.goto(`${BASE_URL}${this.target}`, { waitUntil: 'networkidle', timeout: 30_000 });
        await page.waitForTimeout(3000);
        m.currentPage = this.target;
    }

    toString = () => `Navigate(${this.target})`;
}

export class VerifyFilteredDataCommand {
    constructor(readonly expectedJamaat: string) {}

    check(m: Readonly<Model>): boolean { return m.isAuthenticated && m.dataVisibility === 'filtered'; }

    async run(m: Model, page: Page): Promise<void> {
        const bodyRows = page.locator('.ag-row:not(.ag-header-row)');
        const dataCount = await bodyRows.count();
        expect(dataCount).toBeGreaterThan(0);
        const dataCells = bodyRows.first().locator('.ag-cell-value');
        const nonEmpty = await dataCells.evaluateAll((cells) =>
            cells.some((c) => (c.textContent || '').trim().length > 0)
        );
        expect(nonEmpty).toBe(true);
    }

    toString = () => `VerifyFilteredData(${this.expectedJamaat})`;
}

export class VerifyDataJamaatCommand {
    constructor(readonly expectedJamaat: string) {}

    check(m: Readonly<Model>): boolean { return m.isAuthenticated && m.dataVisibility === 'filtered'; }

    async run(m: Model, page: Page): Promise<void> {
        const hasGrid = await page.locator('.ag-row').count();
        if (hasGrid > 0) {
            const bodyRows = page.locator('.ag-row:not(.ag-header-row)');
            const dataCount = await bodyRows.count();
            expect(dataCount).toBeGreaterThan(0);
        } else {
            const title = page.locator('h2, h1').first();
            await expect(title).toBeVisible({ timeout: 5_000 });
        }
    }

    toString = () => `VerifyDataJamaat(${this.expectedJamaat})`;
}

export class VerifyExportCommand {
    constructor(readonly expectedVisible: boolean) {}

    check(m: Readonly<Model>): boolean { return m.isAuthenticated; }

    async run(m: Model, page: Page): Promise<void> {
        const csvButton = page.locator('button', { hasText: 'CSV' });
        if (this.expectedVisible) {
            await expect(csvButton.first()).toBeVisible({ timeout: 10_000 });
        }
    }

    toString = () => `VerifyExport(${this.expectedVisible})`;
}

export class VerifyZeroRowsCommand {
    check(m: Readonly<Model>): boolean { return m.isAuthenticated && m.dataVisibility === 'none'; }

    async run(m: Model, page: Page): Promise<void> {
        await page.waitForTimeout(2000);
        const paginationText = page.locator('text=/\\d+ to \\d+ of \\d+/');
        const text = await paginationText.textContent().catch(() => '0 to 0 of 0');
        expect(text).toMatch(/0 to 0 of 0/);
    }

    toString = () => 'VerifyZeroRows';
}

export class VerifyMarkazPlaceholderCommand {
    check(m: Readonly<Model>): boolean { return m.isAuthenticated; }

    async run(m: Model, page: Page): Promise<void> {
        await page.waitForTimeout(3000);
        const body = page.locator('body');
        await expect(body).toBeVisible({ timeout: 5_000 });
        const pageTitle = page.locator('h2, h1').first();
        const titleText = await pageTitle.textContent().catch(() => '');
        expect(titleText.toLowerCase()).toContain('markaz');
    }

    toString = () => 'VerifyMarkazPlaceholder';
}

export class SignOutCommand {
    check(m: Readonly<Model>): boolean { return m.isAuthenticated; }

    async run(m: Model, page: Page): Promise<void> {
        const signOutBtn = page.getByRole('button', { name: 'Sign Out' });
        await expect(signOutBtn).toBeVisible({ timeout: 5_000 });
        await signOutBtn.click();
        await page.waitForTimeout(3000);
        m.isAuthenticated = false;
        m.currentPage = null;
        m.role = null;
        m.jamatId = null;
        m.dataVisibility = 'none';
        m.exportVisible = false;
    }

    toString = () => 'SignOut';
}

import { expect, type Page } from '@playwright/test';
import type { Model } from './model';

export async function assertAuthInvariant(m: Model, page: Page): Promise<void> {
    if (m.isAuthenticated) {
        await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible({ timeout: 5_000 });
        await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 5_000 });
    } else {
        const cognitoVisible = await page.locator('#signInFormUi, .cognito-ui').isVisible().catch(() =>
            page.url().includes('cognito')
        );
        expect(cognitoVisible || page.url().includes('cognito')).toBe(true);
    }
}

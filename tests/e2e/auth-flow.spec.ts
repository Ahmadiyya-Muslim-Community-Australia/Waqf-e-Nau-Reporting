import { test } from '@playwright/test';
import { expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://d2tm9r4awhgiop.cloudfront.net';

test.describe('Auth Flow', () => {
    test('unauthenticated user is redirected to Cognito login', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        const url = page.url();
        expect(url).toContain('cognito');
    });
});

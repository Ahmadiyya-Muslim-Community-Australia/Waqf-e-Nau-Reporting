import { test } from '@playwright/test';
import { LoginCommand, NavigateCommand, VerifyMarkazPlaceholderCommand } from './helpers/auth-commands';
import { ROLES } from './helpers/roles';
import type { Model } from './helpers/model';

function initialModel(): Model {
    return {
        isAuthenticated: false,
        currentPage: null, role: null, jamatId: null,
        dataVisibility: 'none', exportVisible: false,
    };
}

async function runCommands(commands: readonly (LoginCommand | NavigateCommand | VerifyMarkazPlaceholderCommand)[], page: any) {
    const m: Model = initialModel();
    for (const cmd of commands) {
        if (cmd.check(m)) {
            await cmd.run(m, page);
        }
    }
}

const cs = ROLES.nationalSecretary;

test.describe('Markaz — Placeholder Page', () => {
    test('Markaz page loads with empty data', async ({ page }) => {
        await runCommands([
            new LoginCommand(cs.email, cs.password, cs.role, cs.jamatId, cs.dataVisibility, cs.exportVisible),
            new NavigateCommand('/markaz/data'),
            new VerifyMarkazPlaceholderCommand(),
        ], page);
    });
});

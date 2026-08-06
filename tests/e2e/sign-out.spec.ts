import { test } from '@playwright/test';
import { LoginCommand, SignOutCommand } from './helpers/auth-commands';
import { ROLES } from './helpers/roles';
import type { Model } from './helpers/model';

function initialModel(): Model {
    return {
        isAuthenticated: false,
        currentPage: null, role: null, jamatId: null,
        dataVisibility: 'none', exportVisible: false,
    };
}

async function runCommands(commands: readonly (LoginCommand | SignOutCommand)[], page: any) {
    const m: Model = initialModel();
    for (const cmd of commands) {
        if (cmd.check(m)) {
            await cmd.run(m, page);
        }
    }
}

const cs = ROLES.jamatSecretary;

test.describe('Sign Out', () => {
    test('sign-out button is visible and clickable', async ({ page }) => {
        await runCommands([
            new LoginCommand(cs.email, cs.password, cs.role, cs.jamatId, cs.dataVisibility, cs.exportVisible),
            new SignOutCommand(),
        ], page);
    });
});

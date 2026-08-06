import { test } from '@playwright/test';
import { LoginCommand, NavigateCommand, VerifyZeroRowsCommand } from './helpers/auth-commands';
import { ROLES } from './helpers/roles';
import type { Model } from './helpers/model';

function initialModel(): Model {
    return {
        isAuthenticated: false,
        currentPage: null, role: null, jamatId: null,
        dataVisibility: 'none', exportVisible: false,
    };
}

async function runCommands(commands: readonly (LoginCommand | NavigateCommand | VerifyZeroRowsCommand)[], page: any) {
    const m: Model = initialModel();
    for (const cmd of commands) {
        if (cmd.check(m)) {
            await cmd.run(m, page);
        }
    }
}

const viewer = ROLES.viewer;

test.describe('Rbac — Viewer Role (Zero Data)', () => {
    test('viewer sees zero Tajneed rows', async ({ page }) => {
        await runCommands([
            new LoginCommand(viewer.email, viewer.password, viewer.role, viewer.jamatId, viewer.dataVisibility, viewer.exportVisible),
            new NavigateCommand('/tajneed/data'),
            new VerifyZeroRowsCommand(),
        ], page);
    });

    test('viewer sees zero Census rows', async ({ page }) => {
        await runCommands([
            new LoginCommand(viewer.email, viewer.password, viewer.role, viewer.jamatId, viewer.dataVisibility, viewer.exportVisible),
            new NavigateCommand('/census/data'),
            new VerifyZeroRowsCommand(),
        ], page);
    });
});

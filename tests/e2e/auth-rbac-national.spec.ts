import { test } from '@playwright/test';
import { LoginCommand, NavigateCommand, VerifyExportCommand } from './helpers/auth-commands';
import { ROLES } from './helpers/roles';
import type { Model } from './helpers/model';

function initialModel(): Model {
    return {
        isAuthenticated: false,
        currentPage: null, role: null, jamatId: null,
        dataVisibility: 'none', exportVisible: false,
    };
}

async function runCommands(commands: readonly (LoginCommand | NavigateCommand | VerifyExportCommand)[], page: any) {
    const m: Model = initialModel();
    for (const cmd of commands) {
        if (cmd.check(m)) {
            await cmd.run(m, page);
        }
    }
}

const natSec = ROLES.nationalSecretary;
const naibNat = ROLES.naibSecretaryNational;

test.describe('Rbac — National Roles (All Data)', () => {
    test('national-secretary sees all Tajneed data', async ({ page }) => {
        await runCommands([
            new LoginCommand(natSec.email, natSec.password, natSec.role, natSec.jamatId, natSec.dataVisibility, natSec.exportVisible),
            new NavigateCommand('/tajneed/data'),
        ], page);
    });

    test('national-secretary sees all Census data', async ({ page }) => {
        await runCommands([
            new LoginCommand(natSec.email, natSec.password, natSec.role, natSec.jamatId, natSec.dataVisibility, natSec.exportVisible),
            new NavigateCommand('/census/data'),
        ], page);
    });

    test('national-secretary can export', async ({ page }) => {
        await runCommands([
            new LoginCommand(natSec.email, natSec.password, natSec.role, natSec.jamatId, natSec.dataVisibility, natSec.exportVisible),
            new NavigateCommand('/tajneed/reports'),
            new VerifyExportCommand(true),
        ], page);
    });

    test('naib-secretary-national sees all Tajneed data', async ({ page }) => {
        await runCommands([
            new LoginCommand(naibNat.email, naibNat.password, naibNat.role, naibNat.jamatId, naibNat.dataVisibility, naibNat.exportVisible),
            new NavigateCommand('/tajneed/data'),
        ], page);
    });

    test('naib-secretary-national sees all Census data', async ({ page }) => {
        await runCommands([
            new LoginCommand(naibNat.email, naibNat.password, naibNat.role, naibNat.jamatId, naibNat.dataVisibility, naibNat.exportVisible),
            new NavigateCommand('/census/data'),
        ], page);
    });
});

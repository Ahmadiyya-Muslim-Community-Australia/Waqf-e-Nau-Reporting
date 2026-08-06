import { test } from '@playwright/test';
import { LoginCommand, NavigateCommand, VerifyFilteredDataCommand, VerifyExportCommand, VerifyDataJamaatCommand } from './helpers/auth-commands';
import { ROLES } from './helpers/roles';
import type { Model } from './helpers/model';

function initialModel(): Model {
    return {
        isAuthenticated: false,
        currentPage: null, role: null, jamatId: null,
        dataVisibility: 'none', exportVisible: false,
    };
}

async function runCommands(commands: readonly (LoginCommand | NavigateCommand | VerifyFilteredDataCommand | VerifyExportCommand | VerifyDataJamaatCommand)[], page: any) {
    const m: Model = initialModel();
    for (const cmd of commands) {
        if (cmd.check(m)) {
            await cmd.run(m, page);
        }
    }
}

const jamatSec = ROLES.jamatSecretary;
const jamatNaib = ROLES.jamatNaib;

test.describe('Rbac — Jamat-Scoped Roles (Tajneed + Census)', () => {
    test('jamat-secretary sees filtered Tajneed data', async ({ page }) => {
        await runCommands([
            new LoginCommand(jamatSec.email, jamatSec.password, jamatSec.role, jamatSec.jamatId, jamatSec.dataVisibility, jamatSec.exportVisible),
            new NavigateCommand('/tajneed/data'),
            new VerifyFilteredDataCommand('Sydney'),
        ], page);
    });

    test('jamat-secretary sees filtered Census data', async ({ page }) => {
        await runCommands([
            new LoginCommand(jamatSec.email, jamatSec.password, jamatSec.role, jamatSec.jamatId, jamatSec.dataVisibility, jamatSec.exportVisible),
            new NavigateCommand('/census/data'),
            new VerifyDataJamaatCommand('Sydney'),
        ], page);
    });

    test('jamat-secretary sees filtered Tajneed Reports with export', async ({ page }) => {
        await runCommands([
            new LoginCommand(jamatSec.email, jamatSec.password, jamatSec.role, jamatSec.jamatId, jamatSec.dataVisibility, jamatSec.exportVisible),
            new NavigateCommand('/tajneed/reports'),
            new VerifyExportCommand(true),
        ], page);
    });

    test('jamat-naib sees filtered Tajneed data', async ({ page }) => {
        await runCommands([
            new LoginCommand(jamatNaib.email, jamatNaib.password, jamatNaib.role, jamatNaib.jamatId, jamatNaib.dataVisibility, jamatNaib.exportVisible),
            new NavigateCommand('/tajneed/data'),
            new VerifyFilteredDataCommand('Sydney'),
        ], page);
    });

    test('jamat-naib sees filtered Census data', async ({ page }) => {
        await runCommands([
            new LoginCommand(jamatNaib.email, jamatNaib.password, jamatNaib.role, jamatNaib.jamatId, jamatNaib.dataVisibility, jamatNaib.exportVisible),
            new NavigateCommand('/census/data'),
            new VerifyDataJamaatCommand('Sydney'),
        ], page);
    });

    test('jamat-naib sees filtered Tajneed Reports', async ({ page }) => {
        await runCommands([
            new LoginCommand(jamatNaib.email, jamatNaib.password, jamatNaib.role, jamatNaib.jamatId, jamatNaib.dataVisibility, jamatNaib.exportVisible),
            new NavigateCommand('/tajneed/reports'),
            new VerifyDataJamaatCommand('Sydney'),
        ], page);
    });
});

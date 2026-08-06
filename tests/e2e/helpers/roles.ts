import type { Role, DataVisibility } from './model';

export type TestUser = {
    readonly email: string;
    readonly password: string;
    readonly role: Role;
    readonly jamatId: string | null;
    readonly dataVisibility: DataVisibility;
    readonly exportVisible: boolean;
};

export const ROLES: Record<string, TestUser> = {
    nationalSecretary: {
        email: 'reports-national@waqfenau.local',
        password: 'ReportsNat123!',
        role: 'wn-national-secretary',
        jamatId: null,
        dataVisibility: 'all',
        exportVisible: true,
    },
    naibSecretaryNational: {
        email: 'reports-naib-national@waqfenau.local',
        password: 'ReportsNaiNat123!',
        role: 'wn-naib-secretary-national',
        jamatId: null,
        dataVisibility: 'all',
        exportVisible: true,
    },
    jamatSecretary: {
        email: 'reports-jamat-sec@waqfenau.local',
        password: 'ReportsJam123!',
        role: 'wn-jamat-secretary',
        jamatId: 'nsw-marsden-park',
        dataVisibility: 'filtered',
        exportVisible: true,
    },
    jamatNaib: {
        email: 'reports-jamat-naib@waqfenau.local',
        password: 'ReportsNai123!',
        role: 'wn-jamat-naib',
        jamatId: 'nsw-marsden-park',
        dataVisibility: 'filtered',
        exportVisible: false,
    },
    viewer: {
        email: 'reports-viewer@waqfenau.local',
        password: 'ReportsVie123!',
        role: null,
        jamatId: null,
        dataVisibility: 'none',
        exportVisible: false,
    },
} as const;

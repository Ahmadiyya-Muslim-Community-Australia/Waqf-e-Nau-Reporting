export type ReportsPage = '/' | '/tajneed/data' | '/tajneed/reports' | '/census/data' | '/markaz/data';

export type Role = 'wn-national-secretary' | 'wn-naib-secretary-national' | 'wn-jamat-secretary' | 'wn-jamat-naib' | null;

export type DataVisibility = 'all' | 'filtered' | 'none';

export type Model = {
    readonly isAuthenticated: boolean;
    readonly currentPage: ReportsPage | null;
    readonly role: Role;
    readonly jamatId: string | null;
    readonly dataVisibility: DataVisibility;
    readonly exportVisible: boolean;
};

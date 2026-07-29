export function escapeLike(value: string): string {
    return value.replace(/[%_']/g, '\\$&');
}

export function escapeSql(value: string): string {
    return value.replace(/'/g, "''");
}

export interface JamaatFilter {
    jamat_id: string;
}

export function buildJamaatClause(filter: JamaatFilter | null, tableAlias?: string): string {
    if (!filter?.jamat_id) return '';
    const col = tableAlias ? `${tableAlias}.jamaat` : 'jamaat';
    return `${col} IN (SELECT label FROM jamaats WHERE jamaatId = '${escapeSql(filter.jamat_id)}')`;
}

export function injectJamaatFilter(
    query: string,
    filter: JamaatFilter | null,
    tableAlias?: string,
): string {
    const clause = buildJamaatClause(filter, tableAlias);
    if (!clause) return query;

    const trimmed = query.trimEnd();
    const whereIdx = trimmed.toUpperCase().indexOf('WHERE');
    if (whereIdx !== -1) {
        const before = trimmed.slice(0, whereIdx + 5);
        const after = trimmed.slice(whereIdx + 5);
        return `${before} ${clause} AND${after}`;
    }

    const groupIdx = trimmed.toUpperCase().indexOf('GROUP BY');
    if (groupIdx !== -1) {
        const before = trimmed.slice(0, groupIdx);
        const after = trimmed.slice(groupIdx);
        return `${before}WHERE ${clause} ${after}`;
    }

    const orderIdx = trimmed.toUpperCase().indexOf('ORDER BY');
    if (orderIdx !== -1) {
        const before = trimmed.slice(0, orderIdx);
        const after = trimmed.slice(orderIdx);
        return `${before}WHERE ${clause} ${after}`;
    }

    return `${trimmed} WHERE ${clause}`;
}

export function buildJamaatJoinClause(
    filter: JamaatFilter | null,
    table: string,
    joinColumn: string,
): string {
    if (!filter?.jamat_id) return '';
    return `${table}.${joinColumn} IN (SELECT member_id FROM members WHERE jamaat = '${escapeSql(filter.jamat_id)}')`;
}

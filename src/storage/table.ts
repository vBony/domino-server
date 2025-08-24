// tableStorage.ts
const tables: Record<string, any> = {};

export class TableStorage {
    static async load(tableName: string) {
        return tables[tableName] || null;
    }

    static async save(tableName: string, data: any) {
        tables[tableName] = data;
    }
}
import { db } from '../database/connection';

export interface EntityFeatures {
    logos?: boolean;
    logoNames?: boolean;
    banners?: boolean;
    team?: boolean;
    lines?: boolean;
    collections?: boolean;
    lookbooks?: boolean;
    skus?: boolean;
    socialLinks?: boolean;
    foundedInfo?: boolean;
    country?: boolean;
    tags?: boolean;
    avatar?: boolean;
    roles?: boolean;
}

export interface EntityLabels {
    logos?: { label?: string; button?: string; helper?: string };
    banners?: { label?: string; button?: string; helper?: string };
    avatar?: { label?: string; button?: string };
    [key: string]: { label?: string; button?: string; helper?: string } | undefined;
}

export interface EntityTab {
    id: string;
    label: string;
}

export interface EntityConfiguration {
    id: string;
    entityType: string;
    displayName: string;
    displayNamePlural: string;
    urlPath: string;
    features: EntityFeatures;
    labels: EntityLabels;
    tabs: EntityTab[];
    createdAt: Date;
    updatedAt: Date;
}

export class EntityConfigurationModel {
    static async findAll(): Promise<EntityConfiguration[]> {
        const query = 'SELECT * FROM entity_configuration ORDER BY display_name ASC';
        const result = await db.query(query);
        return result.rows.map(this.mapRowToConfig);
    }

    static async findByType(entityType: string): Promise<EntityConfiguration | null> {
        const query = 'SELECT * FROM entity_configuration WHERE entity_type = $1';
        const result = await db.query(query, [entityType]);
        return result.rows.length > 0 ? this.mapRowToConfig(result.rows[0]) : null;
    }

    static async update(entityType: string, data: {
        displayName?: string;
        displayNamePlural?: string;
        urlPath?: string;
        features?: EntityFeatures;
        labels?: EntityLabels;
        tabs?: EntityTab[];
    }): Promise<EntityConfiguration | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.displayName !== undefined) {
            setClause.push(`display_name = $${paramIndex++}`);
            values.push(data.displayName);
        }
        if (data.displayNamePlural !== undefined) {
            setClause.push(`display_name_plural = $${paramIndex++}`);
            values.push(data.displayNamePlural);
        }
        if (data.urlPath !== undefined) {
            setClause.push(`url_path = $${paramIndex++}`);
            values.push(data.urlPath);
        }
        if (data.features !== undefined) {
            setClause.push(`features = $${paramIndex++}`);
            values.push(JSON.stringify(data.features));
        }
        if (data.labels !== undefined) {
            setClause.push(`labels = $${paramIndex++}`);
            values.push(JSON.stringify(data.labels));
        }
        if (data.tabs !== undefined) {
            setClause.push(`tabs = $${paramIndex++}`);
            values.push(JSON.stringify(data.tabs));
        }

        if (setClause.length === 0) {
            return this.findByType(entityType);
        }

        setClause.push(`updated_at = NOW()`);
        values.push(entityType);

        const query = `
            UPDATE entity_configuration
            SET ${setClause.join(', ')}
            WHERE entity_type = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToConfig(result.rows[0]) : null;
    }

    private static mapRowToConfig(row: any): EntityConfiguration {
        return {
            id: row.id,
            entityType: row.entity_type,
            displayName: row.display_name,
            displayNamePlural: row.display_name_plural,
            urlPath: row.url_path,
            features: row.features || {},
            labels: row.labels || {},
            tabs: row.tabs || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

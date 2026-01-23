import { db } from '../database/connection';
import { SportDepartment, SportOrg } from '@vangarments/shared/types';

export class SportDepartmentModel {
    static async create(data: {
        sportOrgId: string;
        name: string;
        slug: string;
        category: 'traditional' | 'esport';
        sportType: string;
        discipline?: string;
        surfaceEnvironment?: string;
        teamFormat?: string;
        logo?: string;
    }): Promise<SportDepartment> {
        const query = `
            INSERT INTO sport_departments (
                sport_org_id, name, slug, category, sport_type, 
                discipline, surface_environment, team_format, logo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            data.sportOrgId, data.name, data.slug, data.category, data.sportType,
            data.discipline, data.surfaceEnvironment, data.teamFormat, data.logo
        ];
        const { rows } = await db.query(query, values);
        return this.mapRowToSportDepartment(rows[0]);
    }

    static async findById(id: string): Promise<SportDepartment | null> {
        const { rows } = await db.query('SELECT * FROM sport_departments WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return null;
        return this.mapRowToSportDepartment(rows[0]);
    }

    static async findByOrgId(orgId: string): Promise<SportDepartment[]> {
        const { rows } = await db.query(
            'SELECT * FROM sport_departments WHERE sport_org_id = $1 AND deleted_at IS NULL ORDER BY name ASC',
            [orgId]
        );
        return rows.map(row => this.mapRowToSportDepartment(row));
    }

    static async update(id: string, data: Partial<SportDepartment>): Promise<SportDepartment | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.name) { fields.push(`name = $${i++}`); values.push(data.name); }
        if (data.slug) { fields.push(`slug = $${i++}`); values.push(data.slug); }
        if (data.category) { fields.push(`category = $${i++}`); values.push(data.category); }
        if (data.sportType) { fields.push(`sport_type = $${i++}`); values.push(data.sportType); }
        if (data.discipline !== undefined) { fields.push(`discipline = $${i++}`); values.push(data.discipline); }
        if (data.surfaceEnvironment !== undefined) { fields.push(`surface_environment = $${i++}`); values.push(data.surfaceEnvironment); }
        if (data.teamFormat !== undefined) { fields.push(`team_format = $${i++}`); values.push(data.teamFormat); }
        if (data.logo !== undefined) { fields.push(`logo = $${i++}`); values.push(data.logo); }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `
            UPDATE sport_departments 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${i} AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(query, values);
        if (rows.length === 0) return null;
        return this.mapRowToSportDepartment(rows[0]);
    }

    static async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query('UPDATE sport_departments SET deleted_at = NOW() WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }

    static mapRowToSportDepartment(row: any): SportDepartment {
        return {
            id: row.id,
            sportOrgId: row.sport_org_id,
            name: row.name,
            slug: row.slug,
            category: row.category,
            sportType: row.sport_type,
            discipline: row.discipline,
            surfaceEnvironment: row.surface_environment,
            teamFormat: row.team_format,
            logo: row.logo,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

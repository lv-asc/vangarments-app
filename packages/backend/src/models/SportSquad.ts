import { db } from '../database/connection';
import { SportSquad, AgeGroup, SquadGender, PlayerInfo } from '@vangarments/shared/types';

export class SportSquadModel {
    static async create(data: {
        sportDepartmentId: string;
        name: string;
        slug: string;
        ageGroup?: AgeGroup;
        gender?: SquadGender;
        geographyContinent?: string;
        geographyCountry?: string;
        geographyState?: string;
        geographyCity?: string;
        geographyRegion?: string;
        logo?: string;
        roster?: PlayerInfo[];
    }): Promise<SportSquad> {
        const query = `
            INSERT INTO sport_squads (
                sport_department_id, name, slug, age_group, gender,
                geography_continent, geography_country, geography_state,
                geography_city, geography_region, logo, roster
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const values = [
            data.sportDepartmentId, data.name, data.slug, data.ageGroup, data.gender,
            data.geographyContinent, data.geographyCountry, data.geographyState,
            data.geographyCity, data.geographyRegion, data.logo, JSON.stringify(data.roster || [])
        ];
        const { rows } = await db.query(query, values);
        return this.mapRowToSportSquad(rows[0]);
    }

    static async findById(id: string): Promise<SportSquad | null> {
        const { rows } = await db.query('SELECT * FROM sport_squads WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return null;
        return this.mapRowToSportSquad(rows[0]);
    }

    static async findByDepartmentId(deptId: string): Promise<SportSquad[]> {
        const { rows } = await db.query(
            'SELECT * FROM sport_squads WHERE sport_department_id = $1 AND deleted_at IS NULL ORDER BY name ASC',
            [deptId]
        );
        return rows.map(row => this.mapRowToSportSquad(row));
    }

    static async update(id: string, data: Partial<SportSquad>): Promise<SportSquad | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.name) { fields.push(`name = $${i++}`); values.push(data.name); }
        if (data.slug) { fields.push(`slug = $${i++}`); values.push(data.slug); }
        if (data.ageGroup) { fields.push(`age_group = $${i++}`); values.push(data.ageGroup); }
        if (data.gender) { fields.push(`gender = $${i++}`); values.push(data.gender); }
        if (data.geographyContinent !== undefined) { fields.push(`geography_continent = $${i++}`); values.push(data.geographyContinent); }
        if (data.geographyCountry !== undefined) { fields.push(`geography_country = $${i++}`); values.push(data.geographyCountry); }
        if (data.geographyState !== undefined) { fields.push(`geography_state = $${i++}`); values.push(data.geographyState); }
        if (data.geographyCity !== undefined) { fields.push(`geography_city = $${i++}`); values.push(data.geographyCity); }
        if (data.geographyRegion !== undefined) { fields.push(`geography_region = $${i++}`); values.push(data.geographyRegion); }
        if (data.logo !== undefined) { fields.push(`logo = $${i++}`); values.push(data.logo); }
        if (data.roster !== undefined) { fields.push(`roster = $${i++}`); values.push(JSON.stringify(data.roster)); }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `
            UPDATE sport_squads 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${i} AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(query, values);
        if (rows.length === 0) return null;
        return this.mapRowToSportSquad(rows[0]);
    }

    static async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query('UPDATE sport_squads SET deleted_at = NOW() WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }

    static mapRowToSportSquad(row: any): SportSquad {
        return {
            id: row.id,
            sportDepartmentId: row.sport_department_id,
            name: row.name,
            slug: row.slug,
            ageGroup: row.age_group,
            gender: row.gender,
            geographyContinent: row.geography_continent,
            geographyCountry: row.geography_country,
            geographyState: row.geography_state,
            geographyCity: row.geography_city,
            geographyRegion: row.geography_region,
            logo: row.logo,
            roster: row.roster || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

import { db } from '../database/connection';
import { SportLeague } from '@vangarments/shared/types';

export class SportLeagueModel {
    static async create(data: {
        name: string;
        slug: string;
        sportType: string;
        category: 'traditional' | 'esport';
        logo?: string;
        website?: string;
        country?: string;
        level?: string;
    }): Promise<SportLeague> {
        const query = `
            INSERT INTO sport_leagues (
                name, slug, sport_type, category, logo, website, country, level
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            data.name, data.slug, data.sportType, data.category,
            data.logo, data.website, data.country, data.level
        ];
        const { rows } = await db.query(query, values);
        return this.mapRowToSportLeague(rows[0]);
    }

    static async findById(id: string): Promise<SportLeague | null> {
        const { rows } = await db.query('SELECT * FROM sport_leagues WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return null;
        return this.mapRowToSportLeague(rows[0]);
    }

    static async findBySlug(slug: string): Promise<SportLeague | null> {
        const { rows } = await db.query('SELECT * FROM sport_leagues WHERE slug = $1 AND deleted_at IS NULL', [slug]);
        if (rows.length === 0) return null;
        return this.mapRowToSportLeague(rows[0]);
    }

    static async findMany(filters: { sportType?: string; category?: string; search?: string } = {}): Promise<SportLeague[]> {
        let query = 'SELECT * FROM sport_leagues WHERE deleted_at IS NULL';
        const values: any[] = [];

        if (filters.sportType) {
            values.push(filters.sportType);
            query += ` AND sport_type = $${values.length}`;
        }

        if (filters.category) {
            values.push(filters.category);
            query += ` AND category = $${values.length}`;
        }

        if (filters.search) {
            values.push(`%${filters.search}%`);
            query += ` AND name ILIKE $${values.length}`;
        }

        query += ' ORDER BY name ASC';
        const { rows } = await db.query(query, values);
        return rows.map(row => this.mapRowToSportLeague(row));
    }

    static async update(id: string, data: Partial<SportLeague>): Promise<SportLeague | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.name) { fields.push(`name = $${i++}`); values.push(data.name); }
        if (data.slug) { fields.push(`slug = $${i++}`); values.push(data.slug); }
        if (data.sportType) { fields.push(`sport_type = $${i++}`); values.push(data.sportType); }
        if (data.category) { fields.push(`category = $${i++}`); values.push(data.category); }
        if (data.logo !== undefined) { fields.push(`logo = $${i++}`); values.push(data.logo); }
        if (data.website !== undefined) { fields.push(`website = $${i++}`); values.push(data.website); }
        if (data.country !== undefined) { fields.push(`country = $${i++}`); values.push(data.country); }
        if (data.level !== undefined) { fields.push(`level = $${i++}`); values.push(data.level); }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `
            UPDATE sport_leagues 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${i} AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(query, values);
        if (rows.length === 0) return null;
        return this.mapRowToSportLeague(rows[0]);
    }

    static async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query('UPDATE sport_leagues SET deleted_at = NOW() WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }

    static async linkSquad(squadId: string, leagueId: string, season: string): Promise<void> {
        await db.query(
            'INSERT INTO sport_squad_leagues (squad_id, league_id, season) VALUES ($1, $2, $3) ON CONFLICT (squad_id, league_id, season) DO NOTHING',
            [squadId, leagueId, season]
        );
    }

    static async unlinkSquad(squadId: string, leagueId: string, season: string): Promise<void> {
        await db.query(
            'DELETE FROM sport_squad_leagues WHERE squad_id = $1 AND league_id = $2 AND season = $3',
            [squadId, leagueId, season]
        );
    }

    static async getLeaguesBySquadId(squadId: string): Promise<any[]> {
        const query = `
            SELECT sl.*, ssl.season, ssl.is_active
            FROM sport_leagues sl
            JOIN sport_squad_leagues ssl ON sl.id = ssl.league_id
            WHERE ssl.squad_id = $1 AND sl.deleted_at IS NULL
        `;
        const { rows } = await db.query(query, [squadId]);
        return rows.map(row => ({
            ...this.mapRowToSportLeague(row),
            season: row.season,
            isActive: row.is_active
        }));
    }

    static mapRowToSportLeague(row: any): SportLeague {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            sportType: row.sport_type,
            category: row.category,
            logo: row.logo,
            website: row.website,
            country: row.country,
            level: row.level,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

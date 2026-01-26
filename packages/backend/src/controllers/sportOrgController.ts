import { Request, Response } from 'express';
import { SportOrgModel } from '../models/SportOrg';
import { SportDepartmentModel } from '../models/SportDepartment';
import { SportSquadModel } from '../models/SportSquad';
import { SportLeagueModel } from '../models/SportLeague';
import { SportOrgService } from '../services/sportOrgService';

export class SportOrgController {
    // Orgs
    static async listOrgs(req: Request, res: Response) {
        try {
            const { orgType, search } = req.query;
            const orgs = await SportOrgModel.findMany({
                orgType: orgType as any,
                search: search as string
            });
            res.json(orgs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list organizations' });
        }
    }

    static async createOrg(req: Request, res: Response) {
        try {
            const org = await SportOrgModel.create(req.body);
            res.status(201).json(org);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create organization' });
        }
    }

    static async getOrg(req: Request, res: Response) {
        try {
            const org = await SportOrgService.getFullHierarchy(req.params.id);
            if (!org) return res.status(404).json({ error: 'Organization not found' });
            res.json(org);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch organization' });
        }
    }

    static async updateOrg(req: Request, res: Response) {
        try {
            const org = await SportOrgModel.update(req.params.id, req.body);
            if (!org) return res.status(404).json({ error: 'Organization not found' });
            res.json(org);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update organization' });
        }
    }

    static async deleteOrg(req: Request, res: Response) {
        try {
            const success = await SportOrgModel.delete(req.params.id);
            res.json({ success });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete organization' });
        }
    }

    // Items Aggregation
    static async getOrgItems(req: Request, res: Response) {
        try {
            const items = await SportOrgService.getOrgItems(req.params.orgId);
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch organization items' });
        }
    }

    // Departments
    static async createDepartment(req: Request, res: Response) {
        try {
            const dept = await SportDepartmentModel.create({
                ...req.body,
                sportOrgId: req.params.orgId
            });
            res.status(201).json(dept);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create department' });
        }
    }

    static async listDepartments(req: Request, res: Response) {
        try {
            const depts = await SportDepartmentModel.findByOrgId(req.params.orgId);
            res.json(depts);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list departments' });
        }
    }

    // Squads
    static async createSquad(req: Request, res: Response) {
        try {
            const squad = await SportSquadModel.create({
                ...req.body,
                sportDepartmentId: req.params.deptId
            });
            res.status(201).json(squad);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create squad' });
        }
    }

    static async quickAddSquads(req: Request, res: Response) {
        try {
            const { template } = req.body;
            const squads = await SportOrgService.quickAddSquads(req.params.orgId, req.params.deptId, template);
            res.status(201).json(squads);
        } catch (error) {
            res.status(500).json({ error: 'Failed to quick add squads' });
        }
    }

    // Leagues
    static async listLeagues(req: Request, res: Response) {
        try {
            const leagues = await SportLeagueModel.findMany(req.query as any);
            res.json(leagues);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list leagues' });
        }
    }

    static async createLeague(req: Request, res: Response) {
        try {
            const league = await SportLeagueModel.create(req.body);
            res.status(201).json(league);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create league' });
        }
    }

    static async linkSquadToLeague(req: Request, res: Response) {
        try {
            const { leagueId, season } = req.body;
            await SportLeagueModel.linkSquad(req.params.squadId, leagueId, season);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to link squad to league' });
        }
    }
}

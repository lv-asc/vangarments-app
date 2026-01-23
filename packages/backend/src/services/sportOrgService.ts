import { SportOrgModel } from '../models/SportOrg';
import { SportDepartmentModel } from '../models/SportDepartment';
import { SportSquadModel } from '../models/SportSquad';
import { SportLeagueModel } from '../models/SportLeague';
import { SportOrg, SportDepartment, SportSquad, SportOrgType } from '@vangarments/shared/types';
import { SQUAD_TEMPLATES } from '@vangarments/shared/constants';

export class SportOrgService {
    /**
     * Get full hierarchy of an org by ID or slug
     */
    static async getFullHierarchy(idOrSlug: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        let org = null;

        if (isUuid) {
            org = await SportOrgModel.findById(idOrSlug);
        }

        if (!org) {
            org = await SportOrgModel.findBySlug(idOrSlug);
        }

        if (!org) return null;

        const departments = await SportDepartmentModel.findByOrgId(org.id);
        const departmentsWithSquads = await Promise.all(
            departments.map(async (dept) => {
                const squads = await SportSquadModel.findByDepartmentId(dept.id);
                const squadsWithLeagues = await Promise.all(
                    squads.map(async (squad) => {
                        const leagues = await SportLeagueModel.getLeaguesBySquadId(squad.id);
                        return { ...squad, leagues };
                    })
                );
                return { ...dept, squads: squadsWithLeagues };
            })
        );

        return { ...org, departments: departmentsWithSquads };
    }

    static async quickAddSquads(orgId: string, deptId: string, templateKey: keyof typeof SQUAD_TEMPLATES) {
        const template = SQUAD_TEMPLATES[templateKey];
        if (!template) throw new Error('Invalid template');

        const dept = await SportDepartmentModel.findById(deptId);
        if (!dept) throw new Error('Department not found');

        const createdSquads = await Promise.all(
            template.map(async (item) => {
                const slug = `${dept.slug}-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
                return SportSquadModel.create({
                    sportDepartmentId: deptId,
                    name: item.name,
                    slug: slug,
                    ageGroup: item.ageGroup as any,
                    gender: item.gender as any
                });
            })
        );

        return createdSquads;
    }

    static async checkSponsorRestriction(orgId: string): Promise<boolean> {
        const org = await SportOrgModel.findById(orgId);
        if (!org) return false;

        // Olympic/National associations often have strict sponsor rules
        return org.orgType === 'national_olympic_committee' || org.orgType === 'national_association';
    }
}

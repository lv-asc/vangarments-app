import { Router } from 'express';
import { SportOrgController } from '../controllers/sportOrgController';
import { AuthUtils } from '../utils/auth';

const router = Router();
const requireAdmin = AuthUtils.requireRole(['admin']);
const authenticate = AuthUtils.authenticateToken;

// Health check / index
router.get('/', SportOrgController.listOrgs);

// Orgs CRUD
router.get('/:id', SportOrgController.getOrg);
router.post('/', authenticate, requireAdmin, SportOrgController.createOrg);
router.put('/:id', authenticate, requireAdmin, SportOrgController.updateOrg);
router.delete('/:id', authenticate, requireAdmin, SportOrgController.deleteOrg);
router.get('/:orgId/items', SportOrgController.getOrgItems);

// Departments CRUD (Nested)
router.get('/:orgId/departments', SportOrgController.listDepartments);
router.post('/:orgId/departments', authenticate, requireAdmin, SportOrgController.createDepartment);

// Squads CRUD (Nested)
router.post('/:orgId/departments/:deptId/squads', authenticate, requireAdmin, SportOrgController.createSquad);
router.post('/:orgId/departments/:deptId/squads/quick-add', authenticate, requireAdmin, SportOrgController.quickAddSquads);

// Leagues CRUD
router.get('/leagues/list', SportOrgController.listLeagues);
router.post('/leagues', authenticate, requireAdmin, SportOrgController.createLeague);
router.post('/squads/:squadId/leagues', authenticate, requireAdmin, SportOrgController.linkSquadToLeague);

export default router;

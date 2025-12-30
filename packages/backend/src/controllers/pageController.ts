import { Request, Response } from 'express';
import { PageModel } from '../models/Page';
import { PageTeamModel } from '../models/PageTeam';
import { AuthenticatedRequest } from '../utils/auth';

export const getAllPages = async (req: Request, res: Response) => {
    try {
        const pages = await PageModel.findAll();
        res.json(pages);
    } catch (error) {
        console.error('Error fetching pages:', error);
        res.status(500).json({ message: 'Error fetching pages', error });
    }
};

export const getPage = async (req: Request, res: Response) => {
    try {
        const page = await PageModel.findBySlugOrId(req.params.id);
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json(page);
    } catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).json({ message: 'Error fetching page', error });
    }
};

export const createPage = async (req: Request, res: Response) => {
    try {
        console.log('Creating page with body:', req.body);
        const newPage = await PageModel.create(req.body);
        res.status(201).json(newPage);
    } catch (error) {
        console.error('Error creating page:', error);
        res.status(400).json({ message: 'Error creating page', error });
    }
};

export const updatePage = async (req: Request, res: Response) => {
    try {
        const updatedPage = await PageModel.update(req.params.id, req.body);
        if (!updatedPage) return res.status(404).json({ message: 'Page not found' });
        res.json(updatedPage);
    } catch (error) {
        console.error('Error updating page:', error);
        res.status(400).json({ message: 'Error updating page', error });
    }
};

export const deletePage = async (req: Request, res: Response) => {
    try {
        const success = await PageModel.delete(req.params.id);
        if (!success) return res.status(404).json({ message: 'Page not found' });
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({ message: 'Error deleting page', error });
    }
};

export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const publicOnly = req.query.public === 'true';
        const members = await PageTeamModel.getTeamMembers(id, publicOnly);
        res.json(members);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ message: 'Error fetching team members', error });
    }
};

export const addTeamMember = async (req: Request, res: Response) => {
    try {
        console.log('Adding page team member:', req.body);
        const { id } = req.params;
        const member = await PageTeamModel.addMember({
            ...req.body,
            pageId: id
        });
        res.status(201).json(member);
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(400).json({ message: 'Error adding team member', error });
    }
};

export const removeTeamMember = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;
        const success = await PageTeamModel.removeMemberById(memberId);
        if (!success) return res.status(404).json({ message: 'Member not found' });
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ message: 'Error removing team member', error });
    }
};

export const updateTeamMember = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;
        const member = await PageTeamModel.updateMember(memberId, req.body);
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (error) {
        console.error('Error updating team member:', error);
        res.status(400).json({ message: 'Error updating team member', error });
    }
};

import { Request, Response } from 'express';
import { JournalismModel } from '../models/Journalism';
import { UserModel } from '../models/User';

export const getAllJournalism = async (req: Request, res: Response) => {
    try {
        const { type, published } = req.query;
        const filter: any = {};
        if (type) filter.type = type as string;
        if (published !== undefined) filter.published = published === 'true';

        const items = await JournalismModel.findAll(filter);

        // Enrich with author details? 
        // For now, return IDs. Frontend can fetch users or we can join here.
        // Let's keep it simple and just return the model data. 
        // If needed, we can add a method to fetch authors.

        res.json(items);
    } catch (error) {
        console.error('Error fetching journalism content:', error);
        res.status(500).json({ message: 'Error fetching journalism content', error });
    }
};

export const getJournalismById = async (req: Request, res: Response) => {
    try {
        const item = await JournalismModel.findBySlugOrId(req.params.id);
        if (!item) return res.status(404).json({ message: 'Content not found' });
        res.json(item);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ message: 'Error fetching content', error });
    }
};

export const createJournalism = async (req: Request, res: Response) => {
    try {
        // Validate authors
        if (req.body.authorIds && req.body.authorIds.length > 0) {
            // Optional: check if users exist and have roles.
            // For speed, assuming frontend sends valid IDs.
        }

        const newItem = await JournalismModel.create(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(400).json({ message: 'Error creating content', error });
    }
};

export const updateJournalism = async (req: Request, res: Response) => {
    try {
        const updatedItem = await JournalismModel.update(req.params.id, req.body);
        if (!updatedItem) return res.status(404).json({ message: 'Content not found' });
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(400).json({ message: 'Error updating content', error });
    }
};

export const deleteJournalism = async (req: Request, res: Response) => {
    try {
        const success = await JournalismModel.delete(req.params.id);
        if (!success) return res.status(404).json({ message: 'Content not found' });
        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ message: 'Error deleting content', error });
    }
};

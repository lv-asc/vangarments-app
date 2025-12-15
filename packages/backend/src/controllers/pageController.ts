import { Request, Response } from 'express';
import { PageModel } from '../models/Page';

export const getAllPages = async (req: Request, res: Response) => {
    try {
        const pages = await PageModel.findAll();
        res.json(pages);
    } catch (error) {
        console.error('Error fetching pages:', error);
        res.status(500).json({ message: 'Error fetching pages', error });
    }
};

export const createPage = async (req: Request, res: Response) => {
    try {
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

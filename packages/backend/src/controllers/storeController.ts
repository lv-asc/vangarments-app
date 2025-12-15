import { Request, Response } from 'express';
import { StoreModel } from '../models/Store';

export const getAllStores = async (req: Request, res: Response) => {
    try {
        const stores = await StoreModel.findAll();
        res.json({ stores }); // Wrap in object to match common API patterns if needed, or just array. AdminUsersPage logic expected {brands: []} or array.
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ message: 'Error fetching stores', error });
    }
};

export const createStore = async (req: Request, res: Response) => {
    try {
        const newStore = await StoreModel.create(req.body);
        res.status(201).json(newStore);
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(400).json({ message: 'Error creating store', error });
    }
};

export const updateStore = async (req: Request, res: Response) => {
    try {
        const updatedStore = await StoreModel.update(req.params.id, req.body);
        if (!updatedStore) return res.status(404).json({ message: 'Store not found' });
        res.json(updatedStore);
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(400).json({ message: 'Error updating store', error });
    }
};

export const deleteStore = async (req: Request, res: Response) => {
    try {
        const success = await StoreModel.delete(req.params.id);
        if (!success) return res.status(404).json({ message: 'Store not found' });
        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ message: 'Error deleting store', error });
    }
};

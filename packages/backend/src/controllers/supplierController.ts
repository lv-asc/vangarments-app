import { Request, Response } from 'express';
import { SupplierModel } from '../models/Supplier';

export const getAllSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await SupplierModel.findAll();
        res.json({ suppliers });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Error fetching suppliers', error });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const newSupplier = await SupplierModel.create(req.body);
        res.status(201).json(newSupplier);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(400).json({ message: 'Error creating supplier', error });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const updatedSupplier = await SupplierModel.update(req.params.id, req.body);
        if (!updatedSupplier) return res.status(404).json({ message: 'Supplier not found' });
        res.json(updatedSupplier);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(400).json({ message: 'Error updating supplier', error });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const success = await SupplierModel.delete(req.params.id);
        if (!success) return res.status(404).json({ message: 'Supplier not found' });
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: 'Error deleting supplier', error });
    }
};

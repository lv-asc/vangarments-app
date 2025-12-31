import type { Metadata } from 'next';
import VerifiedEntitiesClient from './VerifiedEntitiesClient';

export const metadata = {
    title: 'Entity Verifications',
    description: 'Manage verification status of entities',
};

export default function VerifiedEntitiesPage() {
    return <VerifiedEntitiesClient />;
}

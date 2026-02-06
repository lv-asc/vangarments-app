
import { Metadata } from 'next';
import CategoriesPage from './HierarchyClient';

export const metadata: Metadata = {
    title: 'Hierarchy',
};

export default function Page() {
    return <CategoriesPage />;
}

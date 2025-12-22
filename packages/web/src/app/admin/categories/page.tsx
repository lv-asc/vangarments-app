
import { Metadata } from 'next';
import CategoriesPage from './CategoriesClient';

export const metadata: Metadata = {
    title: 'Categories',
};

export default function Page() {
    return <CategoriesPage />;
}

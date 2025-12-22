
import { Metadata } from 'next';
import AdminMaterialsPage from './MaterialsClient';

export const metadata: Metadata = {
    title: 'Materials',
};

export default function Page() {
    return <AdminMaterialsPage />;
}

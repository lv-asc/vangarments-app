import type { Metadata } from 'next';
import SilhouetteManagement from '@/components/admin/SilhouetteManagement';

export const metadata: Metadata = {
    title: 'Silhouettes',
};

export default function SilhouettesPage() {
    return <SilhouetteManagement />;
}

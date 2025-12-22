
import { Metadata } from 'next';
import AdminVUFSPage from './VUFSClient';

export const metadata: Metadata = {
    title: 'VUFS Attributes',
};

export default function Page() {
    return <AdminVUFSPage />;
}

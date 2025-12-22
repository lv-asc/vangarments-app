
import { Metadata } from 'next';
import AdminConfigurationPage from './ConfigurationClient';

export const metadata: Metadata = {
    title: 'Configuration',
};

export default function Page() {
    return <AdminConfigurationPage />;
}

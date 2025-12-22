
import { Metadata } from 'next';
import SettingsPage from './SettingsPageClient';

export const metadata: Metadata = {
    title: 'Settings',
};

export default function Page() {
    return <SettingsPage />;
}

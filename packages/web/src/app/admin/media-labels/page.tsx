import { Metadata } from 'next';
import MediaLabelsClient from './MediaLabelsClient';

export const metadata: Metadata = {
    title: 'Admin - Media Labels',
};

export default function MediaLabelsPage() {
    return <MediaLabelsClient />;
}

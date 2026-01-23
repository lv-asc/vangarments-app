import SportOrgsBrowseClient from './SportOrgsBrowseClient';

export const metadata = {
    title: 'Sport ORGs',
    description: 'Discover sports institutions, clubs, and competitive leagues around the world.',
};

export default function SportOrgsBrowsePage() {
    return <SportOrgsBrowseClient />;
}

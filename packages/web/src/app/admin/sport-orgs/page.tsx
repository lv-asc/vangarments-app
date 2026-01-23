import SportOrgsClient from './SportOrgsClient';

export const metadata = {
    title: 'Sport ORGs',
    description: 'Manage Sports and e-Sports organizations, departments, and squads.',
};

export default function AdminSportOrgsPage() {
    return <SportOrgsClient />;
}

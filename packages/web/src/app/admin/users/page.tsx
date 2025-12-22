
import { Metadata } from 'next';
import AdminUsersPage from './UsersClient';

export const metadata: Metadata = {
    title: 'Users',
};

export default function Page() {
    return <AdminUsersPage />;
}

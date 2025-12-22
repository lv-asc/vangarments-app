
import { Metadata } from 'next';
import AdminMeasurementsPage from './MeasurementsClient';

export const metadata: Metadata = {
    title: 'Measurements',
};

export default function Page() {
    return <AdminMeasurementsPage />;
}

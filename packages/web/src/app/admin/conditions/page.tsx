import { Metadata } from 'next';
import ConditionsClient from './ConditionsClient';

export const metadata: Metadata = {
    title: 'Conditions',
};

export default function ConditionsPage() {
    return <ConditionsClient />;
}

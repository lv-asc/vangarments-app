import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

export const metadata: Metadata = {
    title: 'Product',
};

export default function Page() {
    return <ProductPageClient />;
}

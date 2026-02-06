'use client';

import React from 'react';
import OutfitEditorClient from '@/components/outfits/OutfitEditorClient';

interface OutfitDetailClientProps {
    outfit: any;
}

export default function OutfitDetailClient({ outfit }: OutfitDetailClientProps) {
    return <OutfitEditorClient mode="edit" initialData={outfit} />;
}

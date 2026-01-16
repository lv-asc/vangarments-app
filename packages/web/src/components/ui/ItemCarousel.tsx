import React, { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProductCard from './ProductCard';

interface ItemCarouselProps {
    title: string;
    items: any[];
    seeAllLink?: string;
}

export default function ItemCarousel({ title, items, seeAllLink }: ItemCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.offsetWidth * 0.8;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="my-12">
            <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <div className="flex items-center gap-4">
                    {seeAllLink && (
                        <a href={seeAllLink} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            See All
                        </a>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-4 px-4 md:px-0 no-scrollbar snap-x snap-mandatory"
            >
                <style jsx>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                {items.map((item) => (
                    <div key={item.id} className="flex-none w-[180px] md:w-[320px] snap-start">
                        <ProductCard item={item} />
                    </div>
                ))}
            </div>
        </div>
    );
}

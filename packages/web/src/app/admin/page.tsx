'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    BuildingStorefrontIcon,
    UsersIcon,
    TagIcon,
    Cog6ToothIcon,
    SwatchIcon,
    FunnelIcon,
    FolderIcon,
    NewspaperIcon,
    BookOpenIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminCardProps {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: any;
    color: string;
}

const SortableAdminCard = ({ item }: { item: AdminCardProps }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    const Icon = item.icon;

    // We make the whole card draggable via attributes/listeners on the Link or a wrapper
    // Since Next Link passes href, we should wrap the content
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
            <Link
                href={item.href}
                className={`block h-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => {
                    if (isDragging) e.preventDefault();
                }}
            >
                <div className={`p-3 rounded-full w-fit mb-4 ${item.color}`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{item.title}</h5>
                <p className="font-normal text-gray-700">{item.description}</p>
            </Link>
        </div>
    );
};

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const defaultCards: AdminCardProps[] = [
        {
            id: 'vufs',
            title: 'VUFS Management',
            description: 'Manage Categories, Attributes, and Matrix values.',
            href: '/admin/vufs',
            icon: TagIcon,
            color: 'bg-purple-600'
        },
        {
            id: 'brands',
            title: 'Brand Profiles',
            description: 'Manage Brands, Logos, and Teams.',
            href: '/admin/brands',
            icon: BuildingStorefrontIcon,
            color: 'bg-blue-600'
        },
        {
            id: 'skus',
            title: 'SKU Management',
            description: 'Manage Global SKUs, Images, and Videos.',
            href: '/admin/skus',
            icon: TagIcon,
            color: 'bg-indigo-600'
        },
        {
            id: 'colors',
            title: 'Colors',
            description: 'Manage Colors and Color Groups.',
            href: '/admin/colors',
            icon: SwatchIcon,
            color: 'bg-pink-600'
        },
        {
            id: 'sizes',
            title: 'Sizes',
            description: 'Manage Sizes, Conversions and Validity.',
            href: '/admin/sizes',
            icon: FunnelIcon,
            color: 'bg-orange-600'
        },
        {
            id: 'users',
            title: 'User Management',
            description: 'Manage Users, Roles, and Permissions.',
            href: '/admin/users',
            icon: UsersIcon,
            color: 'bg-green-600'
        },
        {
            id: 'config',
            title: 'System Configuration',
            description: 'Global settings and system parameters.',
            href: '/admin/configuration',
            icon: Cog6ToothIcon,
            color: 'bg-gray-600'
        },
        {
            id: 'apparel',
            title: 'Apparel',
            description: 'Manage Apparel Categories and Attributes.',
            href: '/admin/apparel',
            icon: TagIcon,
            color: 'bg-pink-600'
        },
        {
            id: 'categories',
            title: 'Categories',
            description: 'Manage hierarchical Categories structure.',
            href: '/admin/categories',
            icon: FolderIcon,
            color: 'bg-emerald-600'
        },
        {
            id: 'stores',
            title: 'Stores',
            description: 'Manage Store Accounts and locations.',
            href: '/admin/stores',
            icon: BuildingStorefrontIcon,
            color: 'bg-purple-600'
        },
        {
            id: 'journalism',
            title: 'Journalism',
            description: 'Manage News, Columns, and Articles.',
            href: '/admin/journalism',
            icon: NewspaperIcon,
            color: 'bg-red-600'
        },
        {
            id: 'pages',
            title: 'Pages',
            description: 'Manage publication pages (Vogue, etc.)',
            href: '/admin/pages',
            icon: BookOpenIcon,
            color: 'bg-purple-500'
        },
        {
            id: 'suppliers',
            title: 'Suppliers',
            description: 'Manage Suppliers and their details.',
            href: '/admin/suppliers',
            icon: TruckIcon,
            color: 'bg-teal-600'
        }
    ];

    const [items, setItems] = useState<AdminCardProps[]>(defaultCards);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedOrder = localStorage.getItem('admin_dashboard_order');
        if (savedOrder) {
            try {
                const orderedIds = JSON.parse(savedOrder) as string[];
                const reordered = orderedIds
                    .map(id => defaultCards.find(c => c.id === id))
                    .filter(Boolean) as AdminCardProps[];

                // Add any new cards that weren't in saved order
                const newCards = defaultCards.filter(c => !orderedIds.includes(c.id));
                setItems([...reordered, ...newCards]);
            } catch (e) {
                console.error('Failed to parse dashboard order', e);
            }
        }
    }, []);

    useEffect(() => {
        if (!isLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('admin_dashboard_order', JSON.stringify(newOrder.map(i => i.id)));
                return newOrder;
            });
        }
    };


    if (isLoading || !isClient) {
        // Show a skeleton or loading spinner to avoid hydration mismatch on list order
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || !user.roles?.includes('admin')) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <SortableAdminCard key={item.id} item={item} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

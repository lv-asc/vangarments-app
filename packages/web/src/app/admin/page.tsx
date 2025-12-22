'use client';

import React, { useState, useEffect, Fragment } from 'react';
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
    TruckIcon,
    HeartIcon,
    ShoppingBagIcon,
    GlobeAltIcon,
    BriefcaseIcon,
    BeakerIcon,
    RectangleGroupIcon,
    AdjustmentsHorizontalIcon,
    CalendarIcon,
    SunIcon,
    Bars3Icon,
    PencilSquareIcon,
    EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Menu, Transition } from '@headlessui/react';

// Sortable Card Component with "Move to" menu
const SortableAdminCard = ({ item, sections, onMoveToSection }: { item: any, sections: any[], onMoveToSection: (itemId: string, targetSectionKey: string) => void }) => {
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
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : 'auto'
    };

    const Icon = item.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex flex-col p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${isDragging ? 'ring-2 ring-blue-500 shadow-2xl rotate-2' : ''}`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-5 rounded-bl-full pointer-events-none group-hover:opacity-10 transition-opacity`} />

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Drag to reorder"
            >
                <Bars3Icon className="h-5 w-5" />
            </div>

            {/* Move To Menu */}
            <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                    </Menu.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="px-1 py-1">
                                <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase">Move to...</div>
                                {sections.map((section) => (
                                    <Menu.Item key={section.key}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => onMoveToSection(item.id, section.key)}
                                                className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-xs`}
                                            >
                                                {section.title}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>

            <Link href={item.href} className="flex-1 flex flex-col pt-2">
                <div className={`p-3 rounded-lg w-fit mb-4 bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {item.description}
                </p>
            </Link>
        </div>
    );
};

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    // Initial Sections
    const defaultSections = [
        { key: 'Commerce & Partners', title: 'Commerce & Partners', description: 'Manage your business relationships and entities' },
        { key: 'Product Catalog', title: 'Product Catalog', description: 'Configure your product taxonomy and inventory' },
        { key: 'Content & Platform', title: 'Content & Platform', description: 'Manage users, pages and system settings' }
    ];

    const [sections, setSections] = useState(defaultSections);

    // Items Order State
    const [sectionsOrder, setSectionsOrder] = useState<{ [key: string]: string[] }>({
        'Commerce & Partners': ['brands', 'stores', 'suppliers', 'non_profits'],
        'Product Catalog': ['vufs', 'categories', 'apparel', 'skus', 'colors', 'sizes', 'materials', 'patterns', 'fits', 'occasions', 'seasons', 'measurements'],
        'Content & Platform': ['users', 'pages', 'journalism', 'config']
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '' });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        setIsClient(true);
        const savedOrder = localStorage.getItem('admin_sections_order');
        if (savedOrder) {
            try { setSectionsOrder(JSON.parse(savedOrder)); } catch (e) { console.error(e); }
        }
        const savedMetadata = localStorage.getItem('admin_sections_metadata');
        if (savedMetadata) {
            try { setSections(JSON.parse(savedMetadata)); } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!isLoading && (!user || !user.roles?.includes('admin'))) router.push('/');
    }, [user, isLoading, router]);

    if (isLoading || !isClient) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!user || !user.roles?.includes('admin')) return null;

    const allItems: { [key: string]: any } = {
        brands: { id: 'brands', title: 'Brand Profiles', description: 'Manage Brands, Logos, and Teams.', href: '/admin/brands', icon: BuildingStorefrontIcon, gradient: 'from-blue-500 to-blue-600' },
        stores: { id: 'stores', title: 'Stores', description: 'Manage Store Accounts and locations.', href: '/admin/stores', icon: ShoppingBagIcon, gradient: 'from-purple-500 to-indigo-600' },
        suppliers: { id: 'suppliers', title: 'Suppliers', description: 'Manage Suppliers and their details.', href: '/admin/suppliers', icon: TruckIcon, gradient: 'from-emerald-500 to-teal-600' },
        non_profits: { id: 'non_profits', title: 'Non Profits', description: 'Manage Non-Profit Organizations.', href: '/admin/non-profits', icon: HeartIcon, gradient: 'from-rose-500 to-red-600' },
        vufs: { id: 'vufs', title: 'VUFS Master Data', description: 'Universal Fashion Standard attributes.', href: '/admin/vufs', icon: GlobeAltIcon, gradient: 'from-teal-500 to-emerald-600' },
        categories: { id: 'categories', title: 'Categories', description: 'Manage hierarchical Categories structure.', href: '/admin/categories', icon: FolderIcon, gradient: 'from-orange-400 to-pink-500' },
        apparel: { id: 'apparel', title: 'Apparel', description: 'Manage Apparel Categories and Attributes.', href: '/admin/apparel', icon: TagIcon, gradient: 'from-pink-500 to-rose-500' },
        skus: { id: 'skus', title: 'SKU Management', description: 'Manage Global SKUs, Images, and Videos.', href: '/admin/skus', icon: BriefcaseIcon, gradient: 'from-cyan-500 to-blue-500' },
        colors: { id: 'colors', title: 'Colors', description: 'Manage Colors and Color Groups.', href: '/admin/colors', icon: SwatchIcon, gradient: 'from-fuchsia-500 to-purple-600' },
        sizes: { id: 'sizes', title: 'Sizes', description: 'Manage Sizes, Conversions and Validity.', href: '/admin/sizes', icon: FunnelIcon, gradient: 'from-amber-500 to-orange-600' },
        materials: { id: 'materials', title: 'Materials', description: 'Manage fabric and material types.', href: '/admin/materials', icon: BeakerIcon, gradient: 'from-lime-500 to-green-600' },
        patterns: { id: 'patterns', title: 'Patterns', description: 'Manage pattern and print types.', href: '/admin/patterns', icon: RectangleGroupIcon, gradient: 'from-indigo-500 to-violet-600' },
        fits: { id: 'fits', title: 'Fits', description: 'Manage fit types and silhouettes.', href: '/admin/fits', icon: AdjustmentsHorizontalIcon, gradient: 'from-sky-500 to-blue-600' },
        occasions: { id: 'occasions', title: 'Occasions', description: 'Manage occasion and event types.', href: '/admin/occasions', icon: CalendarIcon, gradient: 'from-red-500 to-rose-600' },
        seasons: { id: 'seasons', title: 'Seasons', description: 'Manage seasonal collections.', href: '/admin/seasons', icon: SunIcon, gradient: 'from-yellow-500 to-amber-600' },
        measurements: { id: 'measurements', title: 'Measurements', description: 'Manage body measurement fields.', href: '/admin/measurements', icon: FunnelIcon, gradient: 'from-stone-500 to-gray-600' },
        users: { id: 'users', title: 'User Management', description: 'Manage Users, Roles, and Permissions.', href: '/admin/users', icon: UsersIcon, gradient: 'from-blue-600 to-indigo-600' },
        pages: { id: 'pages', title: 'Pages', description: 'Manage publication pages (Vogue, etc.)', href: '/admin/pages', icon: BookOpenIcon, gradient: 'from-violet-500 to-purple-500' },
        journalism: { id: 'journalism', title: 'Journalism', description: 'Manage News, Columns, and Articles.', href: '/admin/journalism', icon: NewspaperIcon, gradient: 'from-slate-600 to-gray-700' },
        config: { id: 'config', title: 'System Configuration', description: 'Global settings and system parameters.', href: '/admin/configuration', icon: Cog6ToothIcon, gradient: 'from-gray-600 to-gray-800' }
    };

    const startEditing = (section: any) => {
        setEditingSectionKey(section.key);
        setEditForm({ title: section.title, description: section.description });
    };

    const saveSection = () => {
        if (!editingSectionKey) return;
        const newSections = sections.map(s => s.key === editingSectionKey ? { ...s, title: editForm.title, description: editForm.description } : s);
        setSections(newSections);
        localStorage.setItem('admin_sections_metadata', JSON.stringify(newSections));
        setEditingSectionKey(null);
    };

    const findContainer = (id: string) => {
        if (id in sectionsOrder) return id;
        return Object.keys(sectionsOrder).find((key) => sectionsOrder[key].includes(id));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;
        if (!overId || active.id in sectionsOrder) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setSectionsOrder((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.indexOf(active.id as string);
            const overIndex = overItems.indexOf(overId as string);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [...prev[activeContainer].filter((item) => item !== active.id)],
                [overContainer]: [...prev[overContainer].slice(0, newIndex), sectionsOrder[activeContainer][activeIndex], ...prev[overContainer].slice(newIndex, prev[overContainer].length)],
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over?.id as string || '');

        if (activeContainer && overContainer && activeContainer === overContainer) {
            const activeIndex = sectionsOrder[activeContainer].indexOf(active.id as string);
            const overIndex = sectionsOrder[overContainer].indexOf(over?.id as string);
            if (activeIndex !== overIndex) {
                setSectionsOrder((prev) => {
                    const newState = { ...prev, [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex) };
                    localStorage.setItem('admin_sections_order', JSON.stringify(newState));
                    return newState;
                });
            }
        } else {
            localStorage.setItem('admin_sections_order', JSON.stringify(sectionsOrder));
        }
        setActiveId(null);
    };

    const handleMoveToSection = (itemId: string, targetSectionKey: string) => {
        const sourceSectionKey = findContainer(itemId);
        if (!sourceSectionKey || sourceSectionKey === targetSectionKey) return;
        setSectionsOrder(prev => {
            const newOrder = { ...prev, [sourceSectionKey]: prev[sourceSectionKey].filter(id => id !== itemId), [targetSectionKey]: [...prev[targetSectionKey], itemId] };
            localStorage.setItem('admin_sections_order', JSON.stringify(newOrder));
            return newOrder;
        });
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Admin Dashboard</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage your application's content, users, and settings.</p>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <div className="space-y-12">
                        {sections.map((section, idx) => (
                            <div key={section.key} className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                <div className="flex items-end justify-between mb-6 border-b border-gray-200 dark:border-gray-800 pb-2 group/header">
                                    <div className="flex-1">
                                        {editingSectionKey === section.key ? (
                                            <div className="flex flex-col gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                    className="text-xl font-bold text-gray-900 border-b border-blue-500 focus:outline-none bg-transparent"
                                                    autoFocus
                                                />
                                                <input
                                                    type="text"
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                    className="text-sm text-gray-500 border-b border-blue-500 focus:outline-none bg-transparent w-full"
                                                />
                                                <div className="flex gap-2 mt-1">
                                                    <button onClick={saveSection} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                                                    <button onClick={() => setEditingSectionKey(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-end gap-2">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {section.title}
                                                        <button onClick={() => startEditing(section)} className="opacity-0 group-hover/header:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity" title="Edit Section Name">
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </button>
                                                    </h2>
                                                    <span className="text-sm text-gray-500 dark:text-gray-500 pb-0.5 block">{section.description}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <SortableContext items={sectionsOrder[section.key]} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[100px] bg-gray-50/50 rounded-xl p-2 border border-dashed border-gray-200">
                                        {sectionsOrder[section.key].map((itemId) => {
                                            const item = allItems[itemId];
                                            if (!item) return null;
                                            return <SortableAdminCard key={item.id} item={item} sections={sections} onMoveToSection={handleMoveToSection} />;
                                        })}
                                        {sectionsOrder[section.key].length === 0 && (
                                            <div className="col-span-full h-full flex items-center justify-center text-gray-400 text-sm italic">Drop items here</div>
                                        )}
                                    </div>
                                </SortableContext>
                            </div>
                        ))}
                    </div>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeId ? (
                            <div className="opacity-90 scale-105 cursor-grabbing">
                                <SortableAdminCard item={allItems[activeId]} sections={sections} onMoveToSection={() => { }} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}

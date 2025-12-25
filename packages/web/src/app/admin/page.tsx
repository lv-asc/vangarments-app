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
    EllipsisHorizontalIcon,
    XMarkIcon,
    CheckIcon,

    UserGroupIcon,
    PlusIcon
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
import { Menu, Transition, Dialog } from '@headlessui/react';

// --- Configuration & Constants ---

const ICON_MAP: { [key: string]: React.ElementType } = {
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
    UserGroupIcon,
};

const GRADIENT_OPTIONS = [
    { name: 'Blue', value: 'from-blue-500 to-blue-600' },
    { name: 'Indigo', value: 'from-indigo-500 to-indigo-600' },
    { name: 'Purple', value: 'from-purple-500 to-purple-600' },
    { name: 'Pink', value: 'from-pink-500 to-rose-500' },
    { name: 'Red', value: 'from-rose-500 to-red-600' },
    { name: 'Orange', value: 'from-orange-500 to-amber-500' },
    { name: 'Amber', value: 'from-amber-500 to-yellow-500' },
    { name: 'Green', value: 'from-emerald-500 to-green-600' },
    { name: 'Teal', value: 'from-teal-500 to-emerald-600' },
    { name: 'Cyan', value: 'from-cyan-500 to-blue-500' },
    { name: 'Slate', value: 'from-slate-600 to-gray-700' },
    { name: 'Gray', value: 'from-gray-600 to-gray-800' },
];

const DEFAULT_ITEMS: { [key: string]: any } = {
    brands: { id: 'brands', title: 'Brand Profiles', description: 'Manage Brands, Logos, and Teams.', href: '/admin/brands', iconName: 'BuildingStorefrontIcon', gradient: 'from-blue-500 to-blue-600' },
    stores: { id: 'stores', title: 'Stores', description: 'Manage Store Accounts and locations.', href: '/admin/stores', iconName: 'ShoppingBagIcon', gradient: 'from-purple-500 to-indigo-600' },
    suppliers: { id: 'suppliers', title: 'Suppliers', description: 'Manage Suppliers and their details.', href: '/admin/suppliers', iconName: 'TruckIcon', gradient: 'from-emerald-500 to-teal-600' },
    non_profits: { id: 'non_profits', title: 'Non Profits', description: 'Manage Non-Profit Organizations.', href: '/admin/non-profits', iconName: 'HeartIcon', gradient: 'from-rose-500 to-red-600' },
    vufs: { id: 'vufs', title: 'VUFS Master Data', description: 'Universal Fashion Standard attributes.', href: '/admin/vufs', iconName: 'GlobeAltIcon', gradient: 'from-teal-500 to-emerald-600' },
    categories: { id: 'categories', title: 'Categories', description: 'Manage hierarchical Categories structure.', href: '/admin/categories', iconName: 'FolderIcon', gradient: 'from-orange-400 to-pink-500' },
    apparel: { id: 'apparel', title: 'Apparel', description: 'Manage Apparel Categories and Attributes.', href: '/admin/apparel', iconName: 'TagIcon', gradient: 'from-pink-500 to-rose-500' },
    skus: { id: 'skus', title: 'SKU Management', description: 'Manage Global SKUs, Images, and Videos.', href: '/admin/skus', iconName: 'BriefcaseIcon', gradient: 'from-cyan-500 to-blue-500' },
    colors: { id: 'colors', title: 'Colors', description: 'Manage Colors and Color Groups.', href: '/admin/colors', iconName: 'SwatchIcon', gradient: 'from-fuchsia-500 to-purple-600' },
    sizes: { id: 'sizes', title: 'Sizes', description: 'Manage Sizes, Conversions and Validity.', href: '/admin/sizes', iconName: 'FunnelIcon', gradient: 'from-amber-500 to-orange-600' },
    materials: { id: 'materials', title: 'Materials', description: 'Manage fabric and material types.', href: '/admin/materials', iconName: 'BeakerIcon', gradient: 'from-lime-500 to-green-600' },
    patterns: { id: 'patterns', title: 'Patterns', description: 'Manage pattern and print types.', href: '/admin/patterns', iconName: 'RectangleGroupIcon', gradient: 'from-indigo-500 to-violet-600' },
    fits: { id: 'fits', title: 'Fits', description: 'Manage fit types and silhouettes.', href: '/admin/fits', iconName: 'AdjustmentsHorizontalIcon', gradient: 'from-sky-500 to-blue-600' },
    occasions: { id: 'occasions', title: 'Occasions', description: 'Manage occasion and event types.', href: '/admin/occasions', iconName: 'CalendarIcon', gradient: 'from-red-500 to-rose-600' },
    seasons: { id: 'seasons', title: 'Seasons', description: 'Manage seasonal collections.', href: '/admin/seasons', iconName: 'SunIcon', gradient: 'from-yellow-500 to-amber-600' },
    genders: { id: 'genders', title: 'Genders', description: 'Manage Gender options.', href: '/admin/genders', iconName: 'UserGroupIcon', gradient: 'from-pink-400 to-purple-400' },
    measurements: { id: 'measurements', title: 'Measurements', description: 'Manage body measurement fields.', href: '/admin/measurements', iconName: 'FunnelIcon', gradient: 'from-stone-500 to-gray-600' },
    users: { id: 'users', title: 'User Management', description: 'Manage Users, Roles, and Permissions.', href: '/admin/users', iconName: 'UsersIcon', gradient: 'from-blue-600 to-indigo-600' },
    pages: { id: 'pages', title: 'Pages', description: 'Manage publication pages (Vogue, etc.)', href: '/admin/pages', iconName: 'BookOpenIcon', gradient: 'from-violet-500 to-purple-500' },
    journalism: { id: 'journalism', title: 'Journalism', description: 'Manage News, Columns, and Articles.', href: '/admin/journalism', iconName: 'NewspaperIcon', gradient: 'from-slate-600 to-gray-700' },
    config: { id: 'config', title: 'System Configuration', description: 'Global settings and system parameters.', href: '/admin/configuration', iconName: 'Cog6ToothIcon', gradient: 'from-gray-600 to-gray-800' }
};


const SortableAdminCard = ({ item, sections, onMoveToSection, onEdit }: { item: any, sections: any[], onMoveToSection: (itemId: string, targetSectionKey: string) => void, onEdit: (item: any) => void }) => {
    const router = useRouter();
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

    const Icon = ICON_MAP[item.iconName] || GlobeAltIcon;

    const handleCardClick = (e: React.MouseEvent) => {
        // Only navigate if the click wasn't on a button or menu
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[role="menu"]') || target.closest('[data-drag-handle]')) {
            return;
        }
        console.log('Navigating to:', item.href);
        // Use window.location as a fallback
        window.location.href = item.href;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handleCardClick}
            className={`group relative flex flex-col min-h-[160px] p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${isDragging ? 'ring-2 ring-blue-500 shadow-2xl rotate-2' : ''}`}
        >
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-5 rounded-bl-full pointer-events-none group-hover:opacity-10 transition-opacity`} />

            {/* Drag Handle */}
            <div
                data-drag-handle
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
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
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => onEdit(item)}
                                            className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                                } group flex w-full items-center rounded-md px-2 py-2 text-xs font-medium`}
                                        >
                                            <PencilSquareIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Edit
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
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

            {/* Content */}
            <div className="flex-1 flex flex-col pt-2">
                <div className={`p-3 rounded-lg w-fit mb-4 bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {item.description}
                </p>
            </div>
        </div>
    );
};

// Edit Item Modal Component
const EditItemModal = ({ isOpen, onClose, item, onSave }: { isOpen: boolean, onClose: () => void, item: any, onSave: (item: any) => void }) => {
    const [formData, setFormData] = useState(item);

    useEffect(() => {
        setFormData(item);
    }, [item]);

    if (!item) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-slate-800">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center mb-4">
                                    Edit Card
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </Dialog.Title>
                                <div className="mt-2 space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Icon Picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                                        <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 border border-gray-200 dark:border-slate-700 rounded-md">
                                            {Object.keys(ICON_MAP).map((iconName) => {
                                                const Icon = ICON_MAP[iconName];
                                                const isSelected = formData.iconName === iconName;
                                                return (
                                                    <button
                                                        key={iconName}
                                                        onClick={() => setFormData({ ...formData, iconName })}
                                                        className={`p-2 rounded-md flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'}`}
                                                        title={iconName}
                                                        type="button"
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Color Picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Theme</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {GRADIENT_OPTIONS.map((option) => {
                                                const isSelected = formData.gradient === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setFormData({ ...formData, gradient: option.value })}
                                                        className={`h-8 rounded-md bg-gradient-to-r ${option.value} relative ring-offset-1 dark:ring-offset-slate-900 ${isSelected ? 'ring-2 ring-blue-500' : 'hover:opacity-90'}`}
                                                        title={option.name}
                                                        type="button"
                                                    >
                                                        {isSelected && <CheckIcon className="h-4 w-4 text-white mx-auto" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                        onClick={() => onSave(formData)}
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700 dark:hover:bg-slate-700"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Create Section Modal
const CreateSectionModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: { title: string, description: string }) => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (title.trim()) {
            onSave({ title, description });
            setTitle('');
            setDescription('');
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-slate-800">
                        <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Section</Dialog.Title>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Section Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                autoFocus
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                                <button onClick={handleSubmit} disabled={!title.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Create</button>
                            </div>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};

// Create Item Modal
const CreateItemModal = ({ isOpen, onClose, sections, onSave }: { isOpen: boolean, onClose: () => void, sections: { key: string, title: string }[], onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        href: '/admin/',
        iconName: 'GlobeAltIcon',
        gradient: 'from-blue-500 to-blue-600',
        sectionKey: sections[0]?.key || ''
    });

    const handleSubmit = () => {
        if (formData.title && formData.sectionKey) {
            onSave(formData);
            setFormData({ ...formData, title: '', description: '', href: '/admin/' });
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                    <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-slate-800 my-8">
                        <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Page Card</Dialog.Title>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Section</label>
                                <select
                                    value={formData.sectionKey}
                                    onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                >
                                    {sections.map(s => <option key={s.key} value={s.key}>{s.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (Href)</label>
                                <input
                                    type="text"
                                    value={formData.href}
                                    onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    rows={2}
                                />
                            </div>
                            {/* Icon Picker (Simplified) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                                <div className="grid grid-cols-8 gap-2 max-h-24 overflow-y-auto p-1 border rounded-md">
                                    {Object.keys(ICON_MAP).map((iconName) => {
                                        const Icon = ICON_MAP[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, iconName })}
                                                className={`p-1 rounded flex justify-center ${formData.iconName === iconName ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Gradient Picker (Simplified) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADIENT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gradient: option.value })}
                                            className={`w-6 h-6 rounded-full bg-gradient-to-r ${option.value} ${formData.gradient === option.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={handleSubmit} disabled={!formData.title.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Create Card</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
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
    const [items, setItems] = useState<{ [key: string]: any }>(DEFAULT_ITEMS);

    // Items Order State
    const [sectionsOrder, setSectionsOrder] = useState<{ [key: string]: string[] }>({
        'Commerce & Partners': ['brands', 'stores', 'suppliers', 'non_profits'],
        'Product Catalog': ['vufs', 'categories', 'apparel', 'skus', 'colors', 'sizes', 'materials', 'patterns', 'fits', 'occasions', 'seasons', 'measurements'],
        'Content & Platform': ['users', 'pages', 'journalism', 'config']
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '' });

    // Creation State
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [showCreateItem, setShowCreateItem] = useState(false);

    // Item Editing State
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        setIsClient(true);
        const savedOrder = localStorage.getItem('admin_sections_order');
        let currentOrder = {
            'Commerce & Partners': ['brands', 'stores', 'suppliers', 'non_profits'],
            'Product Catalog': ['vufs', 'categories', 'apparel', 'skus', 'colors', 'sizes', 'materials', 'patterns', 'fits', 'occasions', 'seasons', 'measurements'],
            'Content & Platform': ['users', 'pages', 'journalism', 'config']
        };

        if (savedOrder) {
            try {
                currentOrder = JSON.parse(savedOrder);
            } catch (e) { console.error(e); }
        }

        // Ensure 'genders' is present (Fix for missing Genders card)
        const allIds = Object.values(currentOrder).flat();
        if (!allIds.includes('genders')) {
            if (currentOrder['Product Catalog']) {
                currentOrder['Product Catalog'].push('genders');
            } else {
                // Fallback if 'Product Catalog' was renamed or deleted
                const firstKey = Object.keys(currentOrder)[0];
                if (firstKey) currentOrder[firstKey].push('genders');
            }
            // Save the fix
            localStorage.setItem('admin_sections_order', JSON.stringify(currentOrder));
        }

        setSectionsOrder(currentOrder);

        const savedMetadata = localStorage.getItem('admin_sections_metadata');
        if (savedMetadata) {
            try { setSections(JSON.parse(savedMetadata)); } catch (e) { console.error(e); }
        }
        const savedItems = localStorage.getItem('admin_items_metadata');
        if (savedItems) {
            try {
                // Merge saved items with items in case new default items were added to code
                setItems(prev => ({ ...prev, ...JSON.parse(savedItems) }));
            } catch (e) { console.error(e); }
        }
    }, [defaultSections]); // Added defaultSections dependency (though it's constant)

    useEffect(() => {
        if (!isLoading && (!user || !user.roles?.includes('admin'))) router.push('/');
    }, [user, isLoading, router]);


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

    const handleSaveItem = (updatedItem: any) => {
        const newItems = { ...items, [updatedItem.id]: updatedItem };
        setItems(newItems);
        localStorage.setItem('admin_items_metadata', JSON.stringify(newItems));
        setEditingItem(null);
    };

    const handleCreateSection = (data: { title: string, description: string }) => {
        const newKey = data.title; // Simple key generation
        if (sections.some(s => s.key === newKey)) return; // Prevent duplicates

        const newSections = [...sections, { key: newKey, ...data }];
        setSections(newSections);
        setSectionsOrder(prev => ({ ...prev, [newKey]: [] }));

        localStorage.setItem('admin_sections_metadata', JSON.stringify(newSections));
        localStorage.setItem('admin_sections_order', JSON.stringify({ ...sectionsOrder, [newKey]: [] }));
    };

    const handleCreateItem = (data: any) => {
        const id = data.title.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        const newItem = {
            id,
            title: data.title,
            description: data.description,
            href: data.href,
            iconName: data.iconName,
            gradient: data.gradient
        };
        const sectionKey = data.sectionKey;

        // Update Items
        const newItems = { ...items, [id]: newItem };
        setItems(newItems);
        localStorage.setItem('admin_items_metadata', JSON.stringify(newItems));

        // Update Order
        const newOrder = {
            ...sectionsOrder,
            [sectionKey]: [...(sectionsOrder[sectionKey] || []), id]
        };
        setSectionsOrder(newOrder);
        localStorage.setItem('admin_sections_order', JSON.stringify(newOrder));
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

    if (isLoading || !isClient) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!user || !user.roles?.includes('admin')) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Admin Dashboard</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCreateSection(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Add Section
                        </button>
                        <button
                            onClick={() => setShowCreateItem(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Add Page
                        </button>
                    </div>
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
                                            const item = items[itemId];
                                            if (!item) return null;
                                            return <SortableAdminCard key={item.id} item={item} sections={sections} onMoveToSection={handleMoveToSection} onEdit={setEditingItem} />;
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
                                <SortableAdminCard item={items[activeId]} sections={sections} onMoveToSection={() => { }} onEdit={() => { }} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Edit Item Modal */}
                {editingItem && (
                    <EditItemModal
                        isOpen={!!editingItem}
                        onClose={() => setEditingItem(null)}
                        item={editingItem}
                        onSave={handleSaveItem}
                    />
                )}
                {/* Create Section Modal */}
                <CreateSectionModal
                    isOpen={showCreateSection}
                    onClose={() => setShowCreateSection(false)}
                    onSave={handleCreateSection}
                />
                {/* Create Item Modal */}
                <CreateItemModal
                    isOpen={showCreateItem}
                    onClose={() => setShowCreateItem(false)}
                    sections={sections}
                    onSave={handleCreateItem}
                />
            </div>
        </div>
    );
}

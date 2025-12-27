---
description: Turn fields into type/dropdown comboboxes with independent search filtering
---

# Type-Dropdown Combo Boxes Workflow

This workflow describes how to implement the "Searchable Multi-Select" pattern for fields that allow selecting multiple entries (like Sizes or Colors).

## 1. Component State
The component should track which dropdown is currently open and handle selected values.

```tsx
const [openDropdown, setOpenDropdown] = useState<'sizes' | 'colors' | null>(null);

// Multi-select handler
const handleMultiSelect = (field: string, id: string) => {
    setFormData(prev => {
        const current = prev[field] || [];
        const updated = current.includes(id)
            ? current.filter(val => val !== id)
            : [...current, id];
        return { ...prev, [field]: updated };
    });
};
```

## 2. Click-Outside Handling
Add a `useEffect` to automatically close dropdowns when clicking anywhere else.

```tsx
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
            setOpenDropdown(null);
        }
    };

    if (openDropdown) {
        document.addEventListener('mousedown', handleClickOutside);
    } else {
        document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [openDropdown]);
```

## 3. UI Implementation
Use an input field for searching and a relative-positioned dropdown list.

### Input with Close Icon
```tsx
<div className="relative">
    <input
        type="text"
        placeholder="Search..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500"
        onFocus={() => setOpenDropdown('field-name')}
        onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            const list = e.currentTarget.nextElementSibling?.nextElementSibling;
            if (list) {
                const items = list.querySelectorAll('label');
                items.forEach(item => {
                    const text = item.textContent?.toLowerCase() || '';
                    (item as HTMLElement).style.display = text.includes(searchTerm) ? 'flex' : 'none';
                });
            }
        }}
    />
    {openDropdown === 'field-name' && (
        <button 
            type="button"
            onClick={() => setOpenDropdown(null)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
        >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    )}
</div>
```

### Dropdown List with "Done" Button
```tsx
<div
    className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
    style={{ display: openDropdown === 'field-name' ? 'block' : 'none' }}
>
    <div className="dropdown-list">
        {options.map(opt => (
            <label key={opt.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                    type="checkbox"
                    checked={selected.includes(opt.id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        handleMultiSelect('field-name', opt.id);
                    }}
                    className="h-4 w-4 text-blue-600"
                />
                <span className="ml-3 text-sm">{opt.name}</span>
            </label>
        ))}
    </div>
    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
        <button
            type="button"
            onClick={() => setOpenDropdown(null)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded"
        >
            Done
        </button>
    </div>
</div>
```

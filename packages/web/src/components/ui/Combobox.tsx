import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useState } from 'react'

interface ComboboxProps {
    value: string | string[] | null
    onChange: (value: any) => void
    options: Array<{ id?: string | number; name: string; value?: string; hex?: string; image?: string; icon?: React.ReactNode }>
    label?: string
    placeholder?: string
    className?: string
    disabled?: boolean
    freeSolo?: boolean
    multiple?: boolean
}

export default function SearchableCombobox({
    value,
    onChange,
    options,
    label,
    placeholder = 'Select option...',
    className = '',
    disabled = false,
    freeSolo = false,
    multiple = false
}: ComboboxProps) {
    const [query, setQuery] = useState('')

    const filteredOptions =
        query === ''
            ? options
            : options.filter((option) =>
                option.name
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .includes(query.toLowerCase().replace(/\s+/g, ''))
            )

    const getSelectedOptions = () => {
        if (multiple && Array.isArray(value)) {
            return options.filter(opt => value.includes(opt.name))
        }
        const opt = options.find((option) => option.name === value)
        return opt ? [opt] : []
    }

    const selectedOptions = getSelectedOptions()
    // For single select, we use the first (and only) selected option for icons/hex etc
    const primarySelected = selectedOptions[0]

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            {/* @ts-ignore */}
            <Combobox
                value={value}
                onChange={onChange}
                disabled={disabled}
                multiple={multiple as any}
            >
                <div className="relative mt-1">
                    <Combobox.Button as="div" className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 sm:text-sm">
                        <div className="flex items-center pl-3">
                            {!multiple && primarySelected?.icon && (
                                <span className="flex-shrink-0 inline-block h-5 w-5 text-gray-500">
                                    {primarySelected.icon}
                                </span>
                            )}
                            {!multiple && primarySelected?.image && (
                                <img
                                    src={primarySelected.image}
                                    alt=""
                                    className="flex-shrink-0 inline-block h-6 w-6 rounded-full border border-gray-200 object-cover bg-gray-50"
                                />
                            )}
                            {!multiple && primarySelected?.hex && !primarySelected?.image && !primarySelected?.icon && (
                                <span
                                    className="flex-shrink-0 inline-block h-4 w-4 rounded-full border border-gray-200"
                                    style={{ backgroundColor: primarySelected.hex }}
                                ></span>
                            )}
                            <Combobox.Input
                                className={`w-full border-none py-2 ${!multiple && (primarySelected?.image || primarySelected?.hex || primarySelected?.icon) ? 'pl-2' : 'pl-0'} pr-10 text-sm leading-5 text-gray-900 focus:ring-0`}
                                displayValue={() => multiple ? query : (value as string || '')}
                                onChange={(event) => {
                                    setQuery(event.target.value)
                                    if (event.target.value === '' && !freeSolo && !multiple) {
                                        onChange(null)
                                    }
                                    if (freeSolo && !multiple) {
                                        onChange(event.target.value)
                                    }
                                }}
                                placeholder={multiple && Array.isArray(value) && value.length > 0 ? `${value.length} selected...` : placeholder}
                                autoComplete="off"
                            />
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </div>
                    </Combobox.Button>
                    {/* @ts-ignore */}
                    <Transition
                        as={Fragment as any}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredOptions.length === 0 && query !== '' ? (
                                freeSolo ? (
                                    <Combobox.Option
                                        key="custom-value"
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={query}
                                    >
                                        <span className="block truncate">Use "{query}"</span>
                                    </Combobox.Option>
                                ) : (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                        Nothing found.
                                    </div>
                                )
                            ) : (
                                filteredOptions.map((option) => (
                                    <Combobox.Option
                                        key={option.id || option.name}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={option.name}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <div className="flex items-center">
                                                    {option.icon && (
                                                        <span className={`flex-shrink-0 inline-block h-5 w-5 mr-2 ${active ? 'text-white' : 'text-gray-500'}`}>
                                                            {option.icon}
                                                        </span>
                                                    )}
                                                    {option.image && (
                                                        <img
                                                            src={option.image}
                                                            alt=""
                                                            className="flex-shrink-0 inline-block h-6 w-6 rounded-full border border-gray-200 mr-2 object-cover bg-gray-50"
                                                        />
                                                    )}
                                                    {option.hex && !option.image && !option.icon && (
                                                        <span
                                                            className="flex-shrink-0 inline-block h-4 w-4 rounded-full border border-gray-200 mr-2"
                                                            style={{ backgroundColor: option.hex }}
                                                        ></span>
                                                    )}
                                                    <span
                                                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                            }`}
                                                    >
                                                        {option.name}
                                                    </span>
                                                </div>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                                            }`}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    )
}

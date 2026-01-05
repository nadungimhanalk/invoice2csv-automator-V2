import React, { useState, useRef } from 'react';
import { X, Plus, Save, RotateCcw, GripVertical, Trash2, Database, Layout, Upload } from 'lucide-react';
import { MappingField, MappingSource, CustomerMasterEntry } from '../types';
import { readCustomerMasterExcel } from '../utils/csvHelper';

import { DEFAULT_MAPPING } from '../utils/constants';

interface MappingEditorProps {
    initialMapping: MappingField[];
    onSave: (newMapping: MappingField[]) => void;
    onClose: () => void;
    customerMaster: CustomerMasterEntry[];
    onSaveCustomerMaster: (newMaster: CustomerMasterEntry[]) => void;
}

const INVOICE_FIELDS = [
    { value: 'referenceNo', label: 'Invoice Number' },
    { value: 'customerName', label: 'Customer Name' },
    { value: 'customerCode', label: 'Customer Code' },
    { value: 'date', label: 'Date' },
];

const ITEM_FIELDS = [
    { value: 'sku', label: 'SKU / Code' },
    { value: 'description', label: 'Description' },
    { value: 'batchId', label: 'Batch / Lot No' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'unitPrice', label: 'Unit Price' },
    { value: 'total', label: 'Total' },
];

type Tab = 'columns' | 'customers';

const MappingEditor: React.FC<MappingEditorProps> = ({
    initialMapping,
    onSave,
    onClose,
    customerMaster,
    onSaveCustomerMaster
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('columns');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mapping State
    const [mapping, setMapping] = useState<MappingField[]>(initialMapping);

    // Customer Master State
    const [masterList, setMasterList] = useState<CustomerMasterEntry[]>(customerMaster);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');

    // --- Mapping Logic ---
    const addColumn = () => {
        const newField: MappingField = {
            id: Math.random().toString(36).substr(2, 9),
            header: 'New Column',
            source: 'static',
            value: '',
        };
        setMapping([...mapping, newField]);
    };

    const removeColumn = (id: string) => {
        setMapping(mapping.filter(m => m.id !== id));
    };

    const updateField = (id: string, updates: Partial<MappingField>) => {
        setMapping(mapping.map(m => (m.id === id ? { ...m, ...updates } : m)));
    };

    const resetToDefault = () => {
        if (confirm('Are you sure you want to reset to standard defaults?')) {
            setMapping(DEFAULT_MAPPING);
        }
    };

    // --- Customer Master Logic ---
    const addCustomer = () => {
        if (!newName.trim() || !newCode.trim()) return;
        setMasterList([...masterList, { customerName: newName, customerCode: newCode }]);
        setNewName('');
        setNewCode('');
    };

    const removeCustomer = (index: number) => {
        setMasterList(masterList.filter((_, i) => i !== index));
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const importedEntries = await readCustomerMasterExcel(file);

            // Merge Logic: Update existing codes, add new entries
            const currentList = [...masterList];
            let addedCount = 0;
            let updatedCount = 0;

            importedEntries.forEach(imported => {
                const existingIndex = currentList.findIndex(
                    curr => curr.customerName.toLowerCase() === imported.customerName.toLowerCase()
                );

                if (existingIndex !== -1) {
                    // Update existing
                    if (currentList[existingIndex].customerCode !== imported.customerCode) {
                        currentList[existingIndex].customerCode = imported.customerCode;
                        updatedCount++;
                    }
                } else {
                    // Add new
                    currentList.push(imported);
                    addedCount++;
                }
            });

            setMasterList(currentList);
            alert(`Import Successful!\nAdded: ${addedCount}\nUpdated: ${updatedCount}`);

        } catch (error) {
            alert(`Import Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSave = () => {
        onSave(mapping);
        onSaveCustomerMaster(masterList);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Config Settings</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage export columns and customer data.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    <button
                        onClick={() => setActiveTab('columns')}
                        className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'columns'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Layout size={18} />
                        Column Mapping
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'customers'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Database size={18} />
                        Customer Master
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

                    {activeTab === 'columns' ? (
                        <div className="space-y-3">
                            {mapping.map((field) => (
                                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md">

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <GripVertical className="text-gray-400 cursor-move hidden sm:block" size={18} />
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Column Header</label>
                                            <input
                                                type="text"
                                                value={field.header}
                                                onChange={(e) => updateField(field.id, { header: e.target.value })}
                                                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                placeholder="Header Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Data Source</label>
                                            <select
                                                value={field.source}
                                                onChange={(e) => updateField(field.id, { source: e.target.value as MappingSource, value: '' })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            >
                                                <option value="invoice">Invoice Data (e.g. Inv #, Date)</option>
                                                <option value="item">Line Item (e.g. SKU, Qty)</option>
                                                <option value="static">Static Text (Fixed Value)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                                            {field.source === 'static' ? (
                                                <input
                                                    type="text"
                                                    value={field.value}
                                                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    placeholder="Enter static text"
                                                />
                                            ) : (
                                                <select
                                                    value={field.value}
                                                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                >
                                                    <option value="">Select Field...</option>
                                                    {field.source === 'invoice' && INVOICE_FIELDS.map(f => (
                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                    ))}
                                                    {field.source === 'item' && ITEM_FIELDS.map(f => (
                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeColumn(field.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors self-end sm:self-center"
                                        title="Remove Column"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}

                            {mapping.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                    <p className="text-gray-500">No columns defined. Add one to get started.</p>
                                </div>
                            )}

                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={addColumn}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 font-medium"
                                >
                                    <Plus size={18} />
                                    Add Column
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="text-sm text-blue-800">
                                    Map extracted <strong>Customer Names</strong> to internal <strong>Customer Codes</strong>.
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        onClick={handleImportClick}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                                    >
                                        <Upload size={14} />
                                        Import Excel
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name (from PDF)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code (Internal)</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {masterList.map((entry, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.customerName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{entry.customerCode}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => removeCustomer(idx)} className="text-red-600 hover:text-red-900">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {masterList.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                                    No customer mappings added yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Mapping</h4>
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Customer Name</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            placeholder="e.g. Cliniqon Inc."
                                        />
                                    </div>
                                    <div className="w-full sm:w-48">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Customer Code</label>
                                        <input
                                            type="text"
                                            value={newCode}
                                            onChange={(e) => setNewCode(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            placeholder="e.g. CUST-001"
                                        />
                                    </div>
                                    <button
                                        onClick={addCustomer}
                                        disabled={!newName || !newCode}
                                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between rounded-b-xl">
                    {activeTab === 'columns' ? (
                        <button
                            onClick={resetToDefault}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                            <RotateCcw size={18} />
                            <span className="hidden sm:inline">Reset Defaults</span>
                        </button>
                    ) : (<div></div>)}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-medium"
                        >
                            <Save size={18} />
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MappingEditor;

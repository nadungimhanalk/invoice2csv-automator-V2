import React, { useState } from 'react';
import { InvoiceData } from '../types';
import { FileText, AlertCircle, Download, ChevronDown, CheckCircle2, Box } from 'lucide-react';

interface PreviewTableProps {
  data: InvoiceData;
  onDownload: () => void;
  onUpdate: (updatedData: InvoiceData) => void;
  index: number;
}

const isValidBatchId = (batchId: string): boolean => {
  if (!batchId) return false;
  return /^[a-z0-9]+$/i.test(batchId);
};

const PreviewTable: React.FC<PreviewTableProps> = ({ data, onDownload, onUpdate, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-lg animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
      {/* Header Bar */}
      <div
        className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center flex-wrap gap-4 bg-white/40 cursor-pointer hover:bg-white/60 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-100/50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-200/50">
            #{index + 1}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="relative group">
                <input
                  type="text"
                  value={data.referenceNo}
                  onChange={(e) => onUpdate({ ...data, referenceNo: e.target.value })}
                  className="w-full bg-transparent border-b border-indigo-200 focus:border-indigo-600 focus:outline-none py-1 text-sm font-bold text-gray-800 tracking-tight transition-colors"
                  placeholder="Invoice No."
                />
                <label className="absolute -top-3 left-0 text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-indigo-600 transition-colors">Invoice No</label>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <div className="relative group">
                <input
                  type="text"
                  value={data.customerCode || ''}
                  onChange={(e) => onUpdate({ ...data, customerCode: e.target.value })}
                  className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-600 focus:outline-none py-1 text-sm font-medium text-gray-600 placeholder-gray-300"
                  placeholder="Customer Code"
                />
                <label className="absolute -top-3 left-0 text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-indigo-600 transition-colors">Customer Code</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 mr-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Box className="w-3.5 h-3.5" />
              {data.lineItems.length} Items
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export XLSX</span>
          </button>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Batch</th>
                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Price</th>
                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white/40 divide-y divide-gray-100">
              {data.lineItems.map((item, index) => {
                const isBatchValid = isValidBatchId(item.batchId);
                return (
                  <tr key={`${item.sku}-${index}`} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-xs font-semibold text-gray-900 font-mono">{item.sku}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-600">{item.description}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs">
                      {isBatchValid ? (
                        <span className="text-gray-600 font-mono bg-gray-100/50 px-2 py-0.5 rounded border border-gray-200/50">{item.batchId}</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 bg-red-50/50 px-2 py-1 rounded border border-red-100 w-fit" title="Invalid Batch ID: Must be alphanumeric">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-mono">{item.batchId || "MISSING"}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-900 text-right font-medium">{item.quantity}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 text-right">{item.unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'LKR' })}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-700 text-right font-semibold">{item.total.toLocaleString('en-US', { style: 'currency', currency: 'LKR' })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50/50 h-2"></div>
      </div>
    </div>
  );
};

export default PreviewTable;
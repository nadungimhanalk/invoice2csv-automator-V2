import React from 'react';
import { InvoiceData } from '../types';
import { FileText, AlertCircle, Download } from 'lucide-react';

interface PreviewTableProps {
  data: InvoiceData;
  onDownload: () => void;
  onUpdate: (updatedData: InvoiceData) => void;
}

const isValidBatchId = (batchId: string): boolean => {
  if (!batchId) return false;
  // Regex to check for only alphanumeric characters (a-z, A-Z, 0-9)
  return /^[a-z0-9]+$/i.test(batchId);
};

const PreviewTable: React.FC<PreviewTableProps> = ({ data, onDownload, onUpdate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Number</label>
            <input
              type="text"
              value={data.referenceNo}
              onChange={(e) => onUpdate({ ...data, referenceNo: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Customer Code</label>
            <input
              type="text"
              value={data.customerCode || ''}
              onChange={(e) => onUpdate({ ...data, customerCode: e.target.value })}
              placeholder="Enter Customer Code"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            <FileText className="w-4 h-4" />
            <span>{data.lineItems.length} Line Items</span>
          </div>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 font-medium text-sm transition-colors shadow-sm"
            title="Download this invoice as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code (SKU)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot No. (Batch)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.lineItems.map((item, index) => {
              const isBatchValid = isValidBatchId(item.batchId);
              return (
                <tr key={`${item.sku}-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {isBatchValid ? (
                      <span className="text-gray-500">{item.batchId}</span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 w-fit" title="Invalid Batch ID: Must be alphanumeric">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="font-medium">{item.batchId || "MISSING"}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'LKR' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.total.toLocaleString('en-US', { style: 'currency', currency: 'LKR' })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreviewTable;
import React, { useState } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import PreviewTable from './components/PreviewTable';
import { extractImageInvoiceData, extractPdfInvoiceData } from './services/gemini';
import { generateExcelBlob, downloadFile } from './utils/csvHelper';
import { InvoiceData, FileProcessingStatus, CustomerType, CustomerMasterEntry } from './types';
import { Download, AlertTriangle, Archive, FileCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import JSZip from 'jszip';
import MappingEditor from './components/MappingEditor';
import { DEFAULT_MAPPING } from './utils/constants';

const App: React.FC = () => {
  const [fileStatuses, setFileStatuses] = useState<FileProcessingStatus[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  // Mapping State
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [mappingConfig, setMappingConfig] = useState<import('./types').MappingField[]>(() => {
    const saved = localStorage.getItem('csvMappingConfig');
    return saved ? JSON.parse(saved) : DEFAULT_MAPPING;
  });

  const saveMapping = (newMapping: import('./types').MappingField[]) => {
    setMappingConfig(newMapping);
    localStorage.setItem('csvMappingConfig', JSON.stringify(newMapping));
  };

  // Customer Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType>(CustomerType.SLIM_HEALTHCARE);
  const [customerMaster, setCustomerMaster] = useState<CustomerMasterEntry[]>(() => {
    const saved = localStorage.getItem('customerMasterConfig');
    return saved ? JSON.parse(saved) : [];
  });

  const saveCustomerMaster = (newMaster: CustomerMasterEntry[]) => {
    setCustomerMaster(newMaster);
    localStorage.setItem('customerMasterConfig', JSON.stringify(newMaster));
  };

  const processFiles = async (files: File[]) => {
    // Initialize statuses
    const newStatuses: FileProcessingStatus[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      status: 'pending'
    }));

    setFileStatuses(prev => [...prev, ...newStatuses]);

    // Process sequentially to be "smooth" or parallel? Parallel is faster.
    // We will process parallel but track status individually.

    // Map files to their IDs for tracking
    const fileMap = files.map((file, index) => ({ file, id: newStatuses[index].id }));

    const promises = fileMap.map(async ({ file, id }) => {
      // Update to processing
      setFileStatuses(prev => prev.map(s => s.id === id ? { ...s, status: 'processing' } : s));

      try {
        // Determine extraction method based on file type
        const reader = new FileReader();
        const result = await new Promise<InvoiceData>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              let extractedData: InvoiceData;
              if (file.type === 'application/pdf') {
                extractedData = await extractPdfInvoiceData(base64Data, selectedCustomer, customerMaster);
              } else {
                extractedData = await extractImageInvoiceData(base64Data, file.type, selectedCustomer, customerMaster);
              }
              resolve(extractedData);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error("File read error"));
          reader.readAsDataURL(file);
        });

        // Update to completed
        setFileStatuses(prev => prev.map(s => s.id === id ? { ...s, status: 'completed', result } : s));
        setInvoices(prev => [...prev, result]);
        return result;

      } catch (error: any) {
        console.error(`Error processing ${file.name}:`, error);
        setFileStatuses(prev => prev.map(s => s.id === id ? { ...s, status: 'error', message: error.message || "Failed to process" } : s));
        return null;
      }
    });

    await Promise.allSettled(promises);
  };

  const handleBatchDownload = async () => {
    if (invoices.length === 0) return;
    if (invoices.length === 1) {
      handleSingleDownload(invoices[0]);
    } else {
      const zip = new JSZip();
      invoices.forEach((invoice, index) => {
        const blob = generateExcelBlob([invoice], mappingConfig);
        let safeRef = invoice.referenceNo.replace(/[^a-z0-9_ -]/gi, '_');
        if (!safeRef) safeRef = `invoice_${index + 1}`;
        let filename = `${safeRef}.xlsx`;
        let counter = 1;
        while (zip.file(filename)) {
          filename = `${safeRef} (${counter}).xlsx`;
          counter++;
        }
        zip.file(filename, blob);
      });
      const content = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadFile(content, `invoices_archive_${timestamp}.zip`);
    }
  };

  const handleSingleDownload = (invoice: InvoiceData) => {
    const blob = generateExcelBlob([invoice], mappingConfig);
    const safeRef = invoice.referenceNo.replace(/[^a-z0-9_ -]/gi, '_');
    downloadFile(blob, `${safeRef}.xlsx`);
  };

  const handleInvoiceUpdate = (index: number, updatedInvoice: InvoiceData) => {
    setInvoices(prev => prev.map((inv, i) => i === index ? updatedInvoice : inv));
  };

  const handleRemoveResult = (index: number) => {
    setInvoices(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setInvoices([]);
    setFileStatuses([]);
  };

  const isProcessing = fileStatuses.some(s => s.status === 'processing');

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header onOpenSettings={() => setIsMappingOpen(true)} />

      {isMappingOpen && (
        <MappingEditor
          initialMapping={mappingConfig}
          onSave={saveMapping}
          onClose={() => setIsMappingOpen(false)}
          customerMaster={customerMaster}
          onSaveCustomerMaster={saveCustomerMaster}
        />
      )}

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Sidebar Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-3xl sticky top-28 transition-all hover:shadow-lg">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                Configuration
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Customer Profile</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value as CustomerType)}
                    className="block w-full pl-8 pr-10 py-3 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl bg-white/50 hover:bg-white transition-all cursor-pointer font-semibold shadow-sm text-gray-700 appearance-none"
                  >
                    <option value={CustomerType.SLIM_HEALTHCARE}>Slim Healthcare</option>
                    <option value={CustomerType.CLINIQON_BIOTECH}>Cliniqon Biotech</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  Determines how the AI interprets the invoice structure.
                </p>
              </div>
            </div>

            {/* Processing Queue List */}
            {fileStatuses.length > 0 && (
              <div className="glass-panel p-5 rounded-3xl animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Activity Queue</h3>
                  {fileStatuses.every(s => s.status !== 'processing') && (
                    <button onClick={() => setFileStatuses([])} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                  )}
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {fileStatuses.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 bg-white/40 p-2.5 rounded-xl border border-white/50 shadow-sm">
                      <div className="flex-shrink-0">
                        {file.status === 'pending' && <div className="w-2 h-2 bg-gray-300 rounded-full ml-1"></div>}
                        {file.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                        {file.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {file.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                        <p className={`text-[10px] ${file.status === 'error' ? 'text-red-500' :
                            file.status === 'completed' ? 'text-green-600' :
                              file.status === 'processing' ? 'text-indigo-500' : 'text-gray-400'
                          }`}>
                          {file.status === 'processing' ? 'Extracting...' :
                            file.status === 'completed' ? 'Ready' :
                              file.status === 'error' ? 'Failed' : 'Queued'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Workspace */}
          <div className="lg:col-span-3">
            <Dropzone onFilesSelect={processFiles} isProcessing={isProcessing} fileStatuses={fileStatuses} />

            {/* Summary / Actions */}
            {invoices.length > 0 && (
              <div className="mb-6 flex justify-between items-end animate-slide-up">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Results</h2>
                  <p className="text-sm text-gray-500">
                    Running total: <span className="font-mono font-semibold text-indigo-600">{invoices.length}</span> invoices
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-white/50 text-gray-600 border border-gray-200/50 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-medium transition-all text-sm backdrop-blur-sm"
                  >
                    Clear Workspace
                  </button>
                  <button
                    onClick={handleBatchDownload}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all transform hover:-translate-y-0.5 font-medium text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    Download All (ZIP)
                  </button>
                </div>
              </div>
            )}

            {/* Invoices List */}
            <div className="space-y-6">
              {invoices.map((invoice, idx) => (
                <PreviewTable
                  key={idx}
                  index={idx}
                  data={invoice}
                  onDownload={() => handleSingleDownload(invoice)}
                  onUpdate={(updatedData) => handleInvoiceUpdate(idx, updatedData)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import PreviewTable from './components/PreviewTable';
import { extractImageInvoiceData, extractPdfInvoiceData } from './services/gemini';
import { generateExcelBlob, downloadFile } from './utils/csvHelper';
import { InvoiceData, AppStatus, CustomerType, CustomerMasterEntry } from './types';
import { Loader2, Download, AlertTriangle, CheckCircle, Archive } from 'lucide-react';
import JSZip from 'jszip';

import MappingEditor from './components/MappingEditor';
import { Settings } from 'lucide-react';

import { DEFAULT_MAPPING } from './utils/constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  // Customer Master State
  const [customerMaster, setCustomerMaster] = useState<CustomerMasterEntry[]>(() => {
    const saved = localStorage.getItem('customerMasterConfig');
    return saved ? JSON.parse(saved) : [];
  });

  const saveCustomerMaster = (newMaster: CustomerMasterEntry[]) => {
    setCustomerMaster(newMaster);
    localStorage.setItem('customerMasterConfig', JSON.stringify(newMaster));
  };

  const processFiles = async (files: File[]) => {
    setStatus(AppStatus.PROCESSING);
    setErrorMessage('');

    const processSingleFile = (file: File): Promise<InvoiceData> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
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
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        reader.readAsDataURL(file);
      });
    };

    try {
      const promises = files.map(file => processSingleFile(file));
      // Use allSettled to allow some files to fail while others succeed
      const results = await Promise.allSettled(promises);

      const successfulData: InvoiceData[] = [];
      const failedFiles: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulData.push(result.value);
        } else {
          failedFiles.push(files[index].name);
          console.error(`Error processing ${files[index].name}:`, result.reason);
        }
      });

      if (successfulData.length > 0) {
        setInvoices(prev => [...prev, ...successfulData]);
        setStatus(AppStatus.SUCCESS);
      }

      if (failedFiles.length > 0) {
        const errorMsg = `Failed to process ${failedFiles.length} file(s): ${failedFiles.join(', ')}.`;
        setErrorMessage(errorMsg);
        if (successfulData.length === 0) {
          setStatus(AppStatus.ERROR);
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "An unexpected error occurred during batch processing.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleBatchDownload = async () => {
    if (invoices.length === 0) return;

    if (invoices.length === 1) {
      // If only one invoice, just download the single Excel file
      const invoice = invoices[0];
      const blob = generateExcelBlob([invoice], mappingConfig);
      const safeRef = invoice.referenceNo.replace(/[^a-z0-9_-]/gi, '_') || 'invoice';
      downloadFile(blob, `${safeRef}.xlsx`);
    } else {
      // If multiple invoices, create a ZIP file containing separate Excel files
      const zip = new JSZip();

      invoices.forEach((invoice, index) => {
        const blob = generateExcelBlob([invoice], mappingConfig);
        // Ensure unique filename in case of duplicate invoice numbers
        let safeRef = invoice.referenceNo.replace(/[^a-z0-9_-]/gi, '_');
        if (!safeRef) safeRef = `invoice_${index + 1}`;

        // If filename exists in zip, append index
        let filename = `${safeRef}.xlsx`;
        let counter = 1;
        while (zip.file(filename)) {
          filename = `${safeRef}_${counter}.xlsx`;
          counter++;
        }

        zip.file(filename, blob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().slice(0, 10);
      const zipFilename = `invoices_archive_${timestamp}.zip`;

      // Trigger download
      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.setAttribute("href", url);
      link.setAttribute("download", zipFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSingleDownload = (invoice: InvoiceData) => {
    const blob = generateExcelBlob([invoice], mappingConfig);
    const safeRef = invoice.referenceNo.replace(/[^a-z0-9_-]/gi, '_');
    downloadFile(blob, `${safeRef}.xlsx`);
  };

  const handleInvoiceUpdate = (index: number, updatedInvoice: InvoiceData) => {
    setInvoices(prev => prev.map((inv, i) => i === index ? updatedInvoice : inv));
  };

  const handleReset = () => {
    setInvoices([]);
    setStatus(AppStatus.IDLE);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Sidebar - Customer Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24 hover:shadow-md transition-shadow duration-300">
              <label className="block text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">
                Configuration
              </label>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select Customer</label>
                <div className="relative">
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value as CustomerType)}
                    className="block w-full pl-3 pr-10 py-3 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl bg-gray-50 hover:bg-white transition-all cursor-pointer font-medium"
                  >
                    <option value={CustomerType.SLIM_HEALTHCARE}>Slim Healthcare</option>
                    <option value={CustomerType.CLINIQON_BIOTECH}>Cliniqon Biotech</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed pt-2 border-t border-gray-50">
                Select the correct customer format to ensure the AI extracts fields accurately.
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">

            {/* Upload Section */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
              <Dropzone onFilesSelect={processFiles} isProcessing={status === AppStatus.PROCESSING} />
            </div>

            {/* Status Indicators */}
            {
              status === AppStatus.PROCESSING && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-lg text-gray-800 font-semibold tracking-tight">Processing Documents...</p>
                  <p className="text-sm text-gray-500 font-medium">Extracting data with Gemini AI</p>
                </div>
              )
            }

            {/* Error Display */}
            {
              errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center text-center">
                  <AlertTriangle className="w-10 h-10 text-red-600 mb-2" />
                  <h3 className="text-lg font-medium text-red-900">Processing Issues</h3>
                  <p className="text-red-700 mt-1">{errorMessage}</p>
                  {status === AppStatus.ERROR && (
                    <button
                      onClick={() => setStatus(AppStatus.IDLE)}
                      className="mt-4 px-4 py-2 bg-white border border-red-300 rounded-md text-red-700 hover:bg-red-50 font-medium text-sm"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )
            }

            {/* Results Section */}
            {
              invoices.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Extraction Results</h2>
                      <p className="text-gray-500 mt-1">Review and export your data</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                      >
                        Clear All
                      </button>
                      {invoices.length > 1 && (
                        <button
                          onClick={handleBatchDownload}
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all transform hover:-translate-y-0.5 font-medium text-sm"
                        >
                          <Archive className="w-4 h-4" />
                          Download All (ZIP)
                        </button>
                      )}
                    </div>
                  </div>

                  {invoices.map((invoice, idx) => (
                    <PreviewTable
                      key={idx}
                      data={invoice}
                      onDownload={() => handleSingleDownload(invoice)}
                      onUpdate={(updatedData) => handleInvoiceUpdate(idx, updatedData)}
                    />
                  ))}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Verified</p>
                      <p className="text-xs text-green-700">Data ready for inventory system import.</p>
                    </div>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Invoice Automator. Private Internal Tool.
          </p>
        </div>
      </footer>
    </div >
  );
};

export default App;
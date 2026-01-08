import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle, FileText, CheckCircle2, Loader2, X } from 'lucide-react';
import { FileProcessingStatus } from '../types';

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing: boolean;
  fileStatuses?: FileProcessingStatus[];
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelect, isProcessing, fileStatuses = [] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndPassFiles = (fileList: FileList) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const validFiles: File[] = [];
    let hasInvalid = false;

    Array.from(fileList).forEach((file) => {
      if (validTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      setError("Some files were skipped. Only PDF, JPG, PNG allowed.");
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      onFilesSelect(validFiles);
    } else if (!validFiles.length) {
      setError("Please upload valid invoice files (PDF, JPG, PNG).");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isProcessing && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFiles(e.dataTransfer.files);
    }
  }, [onFilesSelect, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFiles(e.target.files);
    }
    // Reset value to allow re-uploading same file if needed in future, though usually managed by key
    e.target.value = '';
  };

  // derived state for compact mode
  const hasFiles = fileStatuses.length > 0;

  return (
    <div className={`w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${hasFiles ? 'mb-6' : 'mb-8'}`}>
      <div
        className={`relative group overflow-hidden rounded-3xl border-2 transition-all duration-300 ${dragActive
            ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
            : "border-gray-200 hover:border-indigo-300 bg-white/60 hover:bg-white/80"
          } ${isProcessing ? "opacity-90 pointer-events-none" : "cursor-pointer"} ${hasFiles ? "h-32" : "h-72"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 backdrop-blur-sm -z-10"></div>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleChange}
          disabled={isProcessing}
          accept="image/png, image/jpeg, image/webp, application/pdf"
          multiple
        />

        <div className="flex flex-col items-center justify-center h-full text-center p-6 relative z-10">
          <div className={`transition-all duration-300 ${dragActive ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:-rotate-[10deg]'
            }`}>
            <div className={`p-3 rounded-2xl shadow-sm mb-3 ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-500'}`}>
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>
          </div>

          <div className={`transition-all duration-300 ${hasFiles ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Upload Invoices
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
              Drag & drop PDFs or Images here, or click to browse
            </p>
          </div>

          {hasFiles && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-3 text-left">
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Add more files</p>
                <p className="text-xs text-gray-500">Drop files to queue</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <span className="text-xl font-light">+</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
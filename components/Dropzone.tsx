import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle, FileText, Files } from 'lucide-react';

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelect, isProcessing }) => {
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
        setError("Some files were skipped. Please upload only PDF, JPG, or PNG files.");
    } else {
        setError(null);
    }

    if (validFiles.length > 0) {
        onFilesSelect(validFiles);
    } else if (!hasInvalid) {
         // If fileList was empty for some reason
    } else {
        // All invalid
        setError("Please upload valid invoice files (PDF, JPG, PNG).");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFiles(e.dataTransfer.files);
    }
  }, [onFilesSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-white hover:bg-gray-50"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleChange}
          disabled={isProcessing}
          accept="image/png, image/jpeg, image/webp, application/pdf"
          multiple
        />

        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <div className={`p-4 rounded-full mb-4 ${dragActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
            {dragActive ? (
                <Files className="w-8 h-8 text-indigo-600" />
            ) : (
                <UploadCloud className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <p className="mb-2 text-lg text-gray-700 font-medium">
            <span className="font-bold text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            Upload multiple Invoices (PDF, JPG, PNG)
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Dropzone;

import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
        isDragOver
          ? 'border-orange-500 bg-orange-500/10 scale-105'
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json,.log"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center space-y-3">
        <div className={`p-3 rounded-full transition-colors ${
          isDragOver ? 'bg-orange-500' : 'bg-slate-700'
        }`}>
          <Upload className={`w-6 h-6 ${isDragOver ? 'text-white' : 'text-orange-500'}`} />
        </div>
        
        <div>
          <p className="font-medium">
            {isDragOver ? 'Drop file here' : 'Upload bid request logs'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Supports .txt, .json, .log files
          </p>
        </div>
        
        <div className="text-xs text-slate-500">
          Click to browse or drag and drop
        </div>
      </div>
      
      {isDragOver && (
        <div className="absolute inset-0 bg-orange-500/5 rounded-lg animate-pulse" />
      )}
    </div>
  );
};

export default FileUpload;

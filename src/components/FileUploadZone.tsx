import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { UploadedFileInfo } from '../types';

interface FileUploadZoneProps {
  uploadedFile: UploadedFileInfo | null;
  onFileExtracted: (fileInfo: UploadedFileInfo) => void;
  onFileRemoved: () => void;
  isExtracting: boolean;
  setIsExtracting: (val: boolean) => void;
  onError: (msg: string) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  uploadedFile,
  onFileExtracted,
  onFileRemoved,
  isExtracting,
  setIsExtracting,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = async (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      onError('Unsupported file format. Please upload a PDF (.pdf), Word (.docx), or Text (.txt) file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    setIsExtracting(true);

    try {
      // For plain text files, read directly in browser
      if (lowerName.endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text();
        if (!text.trim()) {
          throw new Error('The uploaded text file is empty.');
        }
        const words = text.split(/\s+/).filter(Boolean).length;
        onFileExtracted({
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          extractedText: text,
          charCount: text.length,
          wordCount: words,
        });
        return;
      }

      // For PDF and DOCX, convert to base64 and send to server parser
      const arrayBuffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from document');
      }

      onFileExtracted({
        name: file.name,
        size: file.size,
        type: file.type,
        extractedText: data.text,
        charCount: data.charCount,
        wordCount: data.wordCount,
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      onError(err.message || 'Failed to extract readable text from document. Please switch to paste-text mode.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
      />

      {uploadedFile ? (
        <div className="bg-white/[0.06] backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                  {uploadedFile.name}
                </p>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/30 text-emerald-300">
                  Parsed
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {formatFileSize(uploadedFile.size)} · {uploadedFile.wordCount?.toLocaleString() || '–'} words extracted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              Replace
            </button>
            <button
              onClick={onFileRemoved}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isExtracting && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer backdrop-blur-md ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/10'
              : 'border-white/20 hover:border-cyan-400/60 bg-white/[0.04] hover:bg-white/[0.08]'
          }`}
        >
          {isExtracting ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-cyan-300 animate-spin mb-2" />
              <p className="text-sm font-medium text-white">
                Extracting and parsing resume content...
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Reading document text for ATS compatibility
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 mb-3 shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Click to upload or drag & drop your resume
              </p>
              <p className="text-xs text-slate-300 mt-1.5">
                Supported formats: PDF, DOCX, or TXT (Max 10MB)
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-300 justify-center">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">.pdf</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">.docx</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">.txt</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

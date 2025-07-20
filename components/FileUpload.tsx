import React, { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { UploadIcon } from './icons/UploadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { FocusIcon } from './icons/FocusIcon';
import { type QuizMode } from '../types';

interface FileUploadProps {
  onProcess: (file: File, mode: QuizMode, startPage?: number, endPage?: number) => void;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onProcess, error }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for page range selection
  const [totalPageCount, setTotalPageCount] = useState<number | null>(null);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [pageCountError, setPageCountError] = useState<string | null>(null);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setPageCountError(null);
        try {
          const fileReader = new FileReader();
          fileReader.onload = async (event) => {
              if (!event.target?.result) return;
              try {
                  const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
                  const doc = await PDFDocument.load(typedArray, { ignoreEncryption: true });
                  setTotalPageCount(doc.getPageCount());
              } catch (err) {
                  console.error("Could not read page count", err);
                  setPageCountError("Could not read this PDF. It might be corrupted or encrypted.");
                  handleResetFile();
              }
          };
          fileReader.readAsArrayBuffer(selectedFile);
        } catch(e) {
            setPageCountError("An unexpected error occurred while reading the file.");
            handleResetFile();
        }
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (!file) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       const droppedFile = e.dataTransfer.files[0];
       const input = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
       handleFileChange(input);
       if(fileInputRef.current) {
          fileInputRef.current.files = e.dataTransfer.files;
       }
    }
  };

  const handleSubmit = (mode: QuizMode) => {
    if (!file) return;

    const start = startPage ? parseInt(startPage, 10) : undefined;
    const end = endPage ? parseInt(endPage, 10) : undefined;

    if (start !== undefined && isNaN(start)) { alert("Start page must be a number."); return; }
    if (end !== undefined && isNaN(end)) { alert("End page must be a number."); return; }
    if (start !== undefined && end !== undefined && start > end) { alert("Start page cannot be greater than end page."); return; }
    if (start !== undefined && start < 1) { alert("Start page must be at least 1."); return; }
    if (end !== undefined && totalPageCount && end > totalPageCount) { alert(`End page cannot be greater than the total pages (${totalPageCount}).`); return; }

    onProcess(file, mode, start, end);
  };
  
  const handleResetFile = () => {
      setFile(null);
      setTotalPageCount(null);
      setStartPage('');
      setEndPage('');
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const renderInitialState = () => (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      {/* Left Panel: PDF Document */}
      <div 
        className={`w-full md:w-1/2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 relative overflow-hidden bg-yellow-100/50 ${isDragging ? 'border-blue-500 bg-blue-100/50' : 'border-yellow-400 hover:border-blue-400'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragEvents}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">PDF Document</h3>
        <div className="space-y-2">
          <div className="text-line w-full bg-yellow-300/80"></div>
          <div className="text-line w-5/6 bg-yellow-300/80"></div>
          <div className="text-line w-full bg-yellow-300/80"></div>
          <div className="text-line w-3/4 bg-yellow-300/80"></div>
          <div className="text-line w-4/6 bg-yellow-300/80"></div>
        </div>
        <div className="absolute inset-0 bg-yellow-50/80 flex flex-col items-center justify-center text-yellow-700 opacity-0 hover:opacity-100 transition-opacity duration-300">
           <UploadIcon className="w-10 h-10 mb-2" />
           <span className="font-semibold">Click or Drag PDF</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="hidden md:block text-slate-400">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
      </div>
       <div className="block md:hidden text-slate-400">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25V3m0 14.25L8.25 13.5M12 17.25l3.75-3.75" />
        </svg>
      </div>

      {/* Right Panel: Placeholder */}
      <div className="w-full md:w-1/2 text-center p-6 bg-green-400 rounded-lg shadow-2xl shadow-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Interactive Quiz</h3>
        <p className="text-sm text-green-800">Upload a PDF to get started...</p>
      </div>
    </div>
  );
  
  const renderFileSelectedState = () => (
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-700 mb-2">
            File Selected: <span className="font-bold text-blue-600">{file?.name}</span>
        </p>
        <button onClick={handleResetFile} className="text-sm text-red-500 hover:underline mb-6">
            Choose a different file
        </button>

        {totalPageCount !== null && (
          <div className="mt-4 p-4 max-w-lg mx-auto bg-sky-50 rounded-lg animate-fade-in border border-sky-200">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Select Page Range </h3>
              <p className="text-sm text-slate-500 mb-4">
                  PDF has <span className="font-bold">{totalPageCount}</span> pages.
              </p>
              <div className="flex justify-center items-center gap-4">
                  <input type="number" value={startPage} onChange={(e) => setStartPage(e.target.value)} placeholder="Start" min="1" max={totalPageCount ?? undefined} className="w-24 p-2 text-center rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder:text-slate-400 border-slate-600" />
                  <span className="text-slate-500 font-semibold">-</span>
                  <input type="number" value={endPage} onChange={(e) => setEndPage(e.target.value)} placeholder="End" min="1" max={totalPageCount ?? undefined} className="w-24 p-2 text-center rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder:text-slate-400 border-slate-600" />
              </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center items-center flex-wrap">
             <button
                onClick={() => handleSubmit('quiz')}
                className="w-full max-w-xs inline-flex gap-2 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <MagicWandIcon className="w-5 h-5" />
                Start Quiz Mode
              </button>
              
               <button
                onClick={() => handleSubmit('learn')}
                className="w-full max-w-xs inline-flex gap-2 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <BookOpenIcon className="w-5 h-5" />
                Start Learn Mode
              </button>
              
              <button
                onClick={() => handleSubmit('focus')}
                className="w-full max-w-xs inline-flex gap-2 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <FocusIcon className="w-5 h-5" />
                Start Focus Mode
              </button>
        </div>
      </div>
  );

  return (
    <div className="p-6 md:p-8">
      {!file ? renderInitialState() : renderFileSelectedState()}
      {(error || pageCountError) && <p className="mt-6 text-center text-red-500 animate-fade-in">{error || pageCountError}</p>}
    </div>
  );
};
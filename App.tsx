
import React, { useState, useCallback, useEffect } from 'react';
import { type PDFDocument } from 'pdf-lib';
import { FileUpload } from './components/FileUpload';
import { Quiz } from './components/Quiz';
import { QuizResult } from './components/QuizResult';
import { Loader } from './components/Loader';
import { generateQuizFromText } from './services/geminiService';
import { type QuizQuestion, type IncorrectQuizQuestion, type QuizMode } from './types';
import { QuizIcon } from './components/icons/QuizIcon';

enum AppState {
  IDLE,
  LOADING,
  QUIZ,
  RESULTS,
}

const CHUNK_SIZE = 3; // Process 3 pages at a time

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState<IncorrectQuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [currentMode, setCurrentMode] = useState<QuizMode>('quiz');
  
  // PDF Processing and Verification State
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0); 
  const [endPageToProcess, setEndPageToProcess] = useState(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [flaggedQuestionIndices, setFlaggedQuestionIndices] = useState<number[]>([]);

  // Two-pass verification state
  const [prefetchedQuestions, setPrefetchedQuestions] = useState<QuizQuestion[] | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');


  const fetchQuizChunk = useCallback(async (startIndex: number) => {
    if (!pdfDoc) return [];

    try {
      const { PDFDocument } = await import('pdf-lib');
      
      const pageIndices = Array.from({ length: Math.min(CHUNK_SIZE, endPageToProcess - startIndex) }, (_, i) => startIndex + i);
      
      const subDocForGemini = await PDFDocument.create();
      const copiedPagesForGemini = await subDocForGemini.copyPages(pdfDoc, pageIndices);
      copiedPagesForGemini.forEach(page => subDocForGemini.addPage(page));
      const base64ChunkPdf = await subDocForGemini.saveAsBase64();
      
      const pageDataPromises = pageIndices.map(async (globalIndex) => {
          const singlePageDoc = await PDFDocument.create();
          const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [globalIndex]);
          singlePageDoc.addPage(copiedPage);
          return singlePageDoc.saveAsBase64({ dataUri: true });
      });
      const pageDataUris = await Promise.all(pageDataPromises);

      const generatedQuiz = await generateQuizFromText(base64ChunkPdf, 'application/pdf');

      if (generatedQuiz.length > 0) {
        return generatedQuiz.map(q => {
            if (q.hasImage && q.pageIndex !== undefined && q.pageIndex < pageDataUris.length) {
                return { ...q, pageData: pageDataUris[q.pageIndex] };
            }
            return q;
        });
      }
      return [];
    } catch (e: any) {
        console.error("Error fetching quiz chunk:", e);
        setError(`An error occurred while fetching questions: ${e.message}`);
        // Depending on context, might want to set AppState to IDLE here
        return [];
    }
  }, [pdfDoc, endPageToProcess]);

  const verifyAndCombineQuestions = (pass1: QuizQuestion[], pass2: QuizQuestion[]): QuizQuestion[] => {
      const questionTextSet = new Set(pass2.map(q => q.question));
      return pass1.filter(q => questionTextSet.has(q.question));
  };

  const loadInitialData = useCallback(async () => {
    if (!pdfDoc) return;
    setStatusMessage('Processing initial pages...');
    setIsPrefetching(true);
    const pass1 = await fetchQuizChunk(currentPageIndex);
    setIsPrefetching(false);

    setStatusMessage('Verifying initial questions...');
    setIsVerifying(true);
    const pass2 = await fetchQuizChunk(currentPageIndex);
    setIsVerifying(false);

    const verifiedQuestions = verifyAndCombineQuestions(pass1, pass2);

    if (verifiedQuestions.length > 0) {
        setAllQuestions(verifiedQuestions);
        const newIndex = currentPageIndex + CHUNK_SIZE;
        setCurrentPageIndex(newIndex);
        if (newIndex >= endPageToProcess) {
            setIsProcessingComplete(true);
        }
        setAppState(AppState.QUIZ);
    } else {
        setError("No scorable questions could be extracted. Please try a different file or page range.");
        setAppState(AppState.IDLE);
    }
    setStatusMessage('');
  }, [pdfDoc, currentPageIndex, endPageToProcess, fetchQuizChunk]);

  useEffect(() => {
    if (appState === AppState.LOADING && pdfDoc && allQuestions.length === 0) {
        loadInitialData();
    }
  }, [appState, pdfDoc, allQuestions.length, loadInitialData]);

  const handlePrefetchRequest = useCallback(async () => {
      if (isPrefetching || isVerifying || isProcessingComplete || prefetchedQuestions) return;

      setIsPrefetching(true);
      setStatusMessage('Prefetching next questions...');
      
      const nextQuestions = await fetchQuizChunk(currentPageIndex);
      setPrefetchedQuestions(nextQuestions);
      
      setIsPrefetching(false);
      setStatusMessage('');
  }, [isPrefetching, isVerifying, isProcessingComplete, prefetchedQuestions, fetchQuizChunk, currentPageIndex]);
  
  const handleVerificationRequest = useCallback(async () => {
      if (isVerifying || isProcessingComplete || !prefetchedQuestions) return;

      setIsVerifying(true);
      setStatusMessage('Verifying next questions...');

      const verificationPass = await fetchQuizChunk(currentPageIndex);
      const verified = verifyAndCombineQuestions(prefetchedQuestions, verificationPass);

      if (verified.length > 0) {
          setAllQuestions(prev => [...prev, ...verified]);
      }

      const newIndex = currentPageIndex + CHUNK_SIZE;
      setCurrentPageIndex(newIndex);
      setPrefetchedQuestions(null);
      
      if (newIndex >= endPageToProcess) {
          setIsProcessingComplete(true);
      }
      
      setIsVerifying(false);
      setStatusMessage('');
  }, [isVerifying, isProcessingComplete, prefetchedQuestions, currentPageIndex, endPageToProcess, fetchQuizChunk]);
  
  const handleRefreshRequest = useCallback(() => {
    if (isPrefetching || isVerifying || isProcessingComplete) return;
    
    // Discard any prefetched data and immediately start a new prefetch cycle
    setPrefetchedQuestions(null);
    // Use a timeout to ensure state update has propagated before starting a new fetch
    setTimeout(() => handlePrefetchRequest(), 50);
  }, [isPrefetching, isVerifying, isProcessingComplete, handlePrefetchRequest]);

  const handleFileProcess = useCallback(async (file: File, mode: QuizMode, startPage?: number, endPage?: number) => {
    handleRetry(); // Reset everything first
    setAppState(AppState.LOADING);
    setStatusMessage("Loading PDF...");
    setCurrentMode(mode);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        if (!event.target?.result) {
          setError('Failed to read the PDF file.');
          setAppState(AppState.IDLE);
          return;
        }
        try {
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const doc = await PDFDocument.load(typedArray);
          const docTotalPages = doc.getPageCount();
          
          setPdfDoc(doc);
          setTotalPageCount(docTotalPages);
          
          const startIndex = startPage ? startPage - 1 : 0;
          const endIndex = endPage ? endPage : docTotalPages;

          if (startIndex < 0 || endIndex > docTotalPages || startIndex >= endIndex) {
            setError("The selected page range is invalid.");
            setAppState(AppState.IDLE);
            return;
          }

          setCurrentPageIndex(startIndex);
          setEndPageToProcess(endIndex);
          // useEffect will trigger loadInitialData
        } catch (e: any) {
           setError(`Could not load the PDF. It might be corrupted or protected. Error: ${e.message}`);
           setAppState(AppState.IDLE);
        }
      };
      
      fileReader.onerror = () => {
        setError('Error reading the PDF file.');
        setAppState(AppState.IDLE);
      };

      fileReader.readAsArrayBuffer(file);

    } catch (e: any) {
      console.error(e);
      setError(`An error occurred: ${e.message}`);
      setAppState(AppState.IDLE);
    }
  }, []);
  
  const handleQuizComplete = useCallback((score: number, incorrect: IncorrectQuizQuestion[]) => {
    setFinalScore(score);
    setIncorrectQuestions(incorrect);
    setAppState(AppState.RESULTS);
  }, []);
  
  const handleFlagQuestion = useCallback((questionIndex: number) => {
    setFlaggedQuestionIndices(prev => 
      prev.includes(questionIndex) 
        ? prev.filter(i => i !== questionIndex) 
        : [...prev, questionIndex]
    );
  }, []);

  const handleRequiz = useCallback(() => {
    if (incorrectQuestions.length > 0) {
      const questionsToRequiz = incorrectQuestions.map(({userAnswers, ...rest}) => rest);
      setAllQuestions(questionsToRequiz);
      setIncorrectQuestions([]);
      setFinalScore(0);
      setError(null);
      setFlaggedQuestionIndices([]);
      setIsProcessingComplete(true);
      setAppState(AppState.QUIZ);
    }
  }, [incorrectQuestions]);

  const handleRetry = useCallback(() => {
    setAppState(AppState.IDLE);
    setAllQuestions([]);
    setIncorrectQuestions([]);
    setFlaggedQuestionIndices([]);
    setFinalScore(0);
    setError(null);
    setPdfDoc(null);
    setTotalPageCount(0);
    setCurrentPageIndex(0);
    setEndPageToProcess(0);
    setIsProcessingComplete(false);
    setStatusMessage('');
    setPrefetchedQuestions(null);
    setIsPrefetching(false);
    setIsVerifying(false);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.LOADING:
        return <Loader message={statusMessage} />;
      case AppState.QUIZ:
        return <Quiz 
                  questions={allQuestions} 
                  onComplete={handleQuizComplete} 
                  mode={currentMode} 
                  isProcessingComplete={isProcessingComplete}
                  onFlagQuestion={handleFlagQuestion}
                  flaggedIndices={flaggedQuestionIndices}
                  onPrefetchRequest={handlePrefetchRequest}
                  onVerificationRequest={handleVerificationRequest}
                  onRefreshRequest={handleRefreshRequest}
                  isFetchingNextChunk={isPrefetching || isVerifying}
                  statusMessage={statusMessage}
               />;
      case AppState.RESULTS:
        const scorableQuestionsCount = allQuestions.filter(q => q.answer.length > 0).length;
        const flaggedQuestions = allQuestions.filter((_, index) => flaggedQuestionIndices.includes(index));
        return (
          <QuizResult 
            score={finalScore} 
            totalQuestions={allQuestions.length}
            scorableQuestionsCount={scorableQuestionsCount}
            incorrectQuestions={incorrectQuestions}
            flaggedQuestions={flaggedQuestions}
            onRetry={handleRetry}
            onRequiz={handleRequiz}
          />
        );
      case AppState.IDLE:
      default:
        return <FileUpload onProcess={handleFileProcess} error={error} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col items-center justify-center p-4 transition-colors duration-500 relative">
      <div className="w-full max-w-4xl mx-auto z-10">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3">
              <QuizIcon className="w-10 h-10 text-blue-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.1)]">
                CCNP Quiz Taker 😊
              </h1>
            </div>
        </header>
        <main className="bg-white rounded-2xl shadow-2xl shadow-sky-200/50">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-sm text-slate-600">
          <p>Made by Ladoo 😁 for Paddu ❤️</p>
        </footer>
      </div>
    </div>
  );
}

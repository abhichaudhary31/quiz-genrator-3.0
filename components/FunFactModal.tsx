
import React from 'react';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface FunFactModalProps {
  isOpen: boolean;
  isLoading: boolean;
  funFact: string | null;
  onContinue: () => void;
}

export const FunFactModal: React.FC<FunFactModalProps> = ({ isOpen, isLoading, funFact, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
            <LightbulbIcon className="w-8 h-8 text-yellow-500"/>
            <h2 className="text-2xl font-bold text-slate-800">Fun Fact!</h2>
        </div>

        <div className="min-h-[120px] flex items-center justify-center my-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-yellow-500"></div>
            <span>Discovering something new...</span>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-lg text-slate-700 font-medium">
              {funFact}
            </p>
          </div>
        )}
        </div>
        
        <button
          onClick={onContinue}
          disabled={isLoading}
          className="w-full max-w-xs inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-blue-500/30 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Loading...' : 'Continue Quiz'}
        </button>
      </div>
    </div>
  );
};


import React from 'react';

interface VerificationProps {
  isFetching: boolean;
  statusMessage: string;
}

export const Verification: React.FC<VerificationProps> = ({ isFetching, statusMessage }) => {
  if (!isFetching || !statusMessage) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 animate-fade-in">
      <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-blue-500"></div>
      <span>{statusMessage}</span>
    </div>
  );
};

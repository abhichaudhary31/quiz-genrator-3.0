
import React from 'react';

export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    {...props}
  >
    <path 
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.049 4.605a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06L10.5 7.122V10.5a.75.75 0 01-1.5 0V7.122L7.97 8.165a.75.75 0 01-1.06-1.06l2.138-2.138zM10 12a.75.75 0 01.75.75v1.543l1.03-1.03a.75.75 0 111.06 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 111.06-1.06l1.03 1.03V12.75A.75.75 0 0110 12z" 
        clipRule="evenodd"
    />
  </svg>
);

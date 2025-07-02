import React from 'react';

export const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 1 0-18h.01a9 9 0 0 1 0 18H12Zm0-2.25a6.75 6.75 0 0 0 0-13.5H12a6.75 6.75 0 0 0 0 13.5h.01ZM12 12a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
    <path d="M12 21a8.962 8.962 0 0 1-5.656-2.343" />
    <path d="M12 3a8.962 8.962 0 0 1 5.656 2.343" />
  </svg>
);

import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            {/* Hexagon Border */}
            <path
                d="M100 20 L170 60 L170 140 L100 180 L30 140 L30 60 Z"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                filter="url(#neon-glow)"
                strokeLinejoin="round"
            />
            {/* Inner Hexagon Shadow style */}
            <path
                d="M100 30 L160 65 L160 135 L100 170 L40 135 L40 65 Z"
                fill="rgba(16, 185, 129, 0.05)"
            />
            {/* The 'X' symbol */}
            <path
                d="M75 75 L125 125"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="round"
                filter="url(#neon-glow)"
            />
            <path
                d="M125 75 L75 125"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="round"
                filter="url(#neon-glow)"
            />
        </svg>
    );
};

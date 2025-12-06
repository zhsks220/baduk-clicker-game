import React from 'react';

// Common props
interface IconProps {
    className?: string;
    style?: React.CSSProperties;
}

// Kawaii Go Stone SVGs
// Style matches ChessIcons: Thick outlines, flat colors, cute faces

export const StoneBlackIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shadow */}
        <ellipse cx="50" cy="85" rx="35" ry="10" fill="black" opacity="0.2" />

        {/* Body - Slightly imperfect circle for organic feel */}
        <path d="M50 15C30 15 15 30 15 50C15 70 30 85 50 85C70 85 85 70 85 50C85 30 70 15 50 15Z"
            fill="#4a4a4a" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Highlight/Shine */}
        <ellipse cx="35" cy="35" rx="10" ry="5" fill="white" opacity="0.1" transform="rotate(-45 35 35)" />

        {/* Face - Angry/Serious */}
        <path d="M35 45L45 50" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" />
        <path d="M65 45L55 50" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="55" r="4" fill="#fab1a0" /> {/* Cheeks - faint red eyes? No, angry eyes */}
        <circle cx="40" cy="55" r="2" fill="white" />

        <circle cx="60" cy="55" r="4" fill="#fab1a0" />
        <circle cx="60" cy="55" r="2" fill="white" />

        {/* Mouth */}
        <path d="M45 65Q50 62 55 65" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const StoneWhiteIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shadow */}
        <ellipse cx="50" cy="85" rx="35" ry="10" fill="black" opacity="0.2" />

        {/* Body */}
        <path d="M50 15C30 15 15 30 15 50C15 70 30 85 50 85C70 85 85 70 85 50C85 30 70 15 50 15Z"
            fill="#ffffff" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Shading */}
        <path d="M20 50Q20 75 50 80" stroke="#dcdde1" strokeWidth="4" fill="none" opacity="0.5" />

        {/* Face - Cute/Determined */}
        <circle cx="38" cy="50" r="4" fill="#2d3436" />
        <circle cx="62" cy="50" r="4" fill="#2d3436" />

        {/* Cheeks */}
        <circle cx="32" cy="58" r="3" fill="#ff7675" opacity="0.6" />
        <circle cx="68" cy="58" r="3" fill="#ff7675" opacity="0.6" />

        {/* Mouth */}
        <path d="M45 58Q50 62 55 58" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

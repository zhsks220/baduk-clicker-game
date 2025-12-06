import React from 'react';

// Common props
interface IconProps {
    className?: string;
    style?: React.CSSProperties;
}

// Cute "Kawaii" Chess Piece SVGs
// Style: Thick outlines, flat colors, cute faces

export const PawnIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <path d="M50 20C40 20 32 28 32 38C32 45 36 51 42 54L38 80H62L58 54C64 51 68 45 68 38C68 28 60 20 50 20Z" fill="#ff9ff3" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 80H70L75 90H25L30 80Z" fill="#2d3436" />
        {/* Face */}
        <circle cx="45" cy="38" r="3" fill="#2d3436" />
        <circle cx="55" cy="38" r="3" fill="#2d3436" />
        <path d="M48 42Q50 44 52 42" stroke="#2d3436" strokeWidth="2" strokeLinecap="round" />
        {/* Shine */}
        <ellipse cx="40" cy="30" rx="3" ry="1.5" fill="white" opacity="0.6" />
    </svg>
);

export const KnightIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <path d="M35 80L30 35C30 25 40 15 55 15C65 15 75 25 70 40L65 50L75 55C75 55 70 70 65 80H35Z" fill="#feca57" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Mane */}
        <path d="M30 35C25 40 25 50 30 55" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" />
        {/* Face */}
        <circle cx="55" cy="30" r="3" fill="#2d3436" />
        <path d="M65 35L50 45" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" />
        {/* Base */}
        <path d="M25 80H75L80 90H20L25 80Z" fill="#2d3436" />
    </svg>
);

export const BishopIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Hat/Body */}
        <path d="M50 10C35 10 25 25 25 45L35 80H65L75 45C75 25 65 10 50 10Z" fill="#54a0ff" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Cross details */}
        <path d="M50 10V5M47 7H53" stroke="#2d3436" strokeWidth="3" />
        <path d="M50 20L50 40" stroke="#2d3436" strokeWidth="2" />
        <path d="M40 30H60" stroke="#2d3436" strokeWidth="2" />
        {/* Eyes */}
        <circle cx="42" cy="50" r="3" fill="#2d3436" />
        <circle cx="58" cy="50" r="3" fill="#2d3436" />
        {/* Base */}
        <path d="M25 80H75L80 90H20L25 80Z" fill="#2d3436" />
    </svg>
);

export const RookIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Turret */}
        <path d="M30 20H40V25H45V20H55V25H60V20H70V40L65 80H35L30 40V20Z" fill="#5f27cd" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Face */}
        <circle cx="42" cy="45" r="3" fill="#white" />
        <circle cx="58" cy="45" r="3" fill="#white" />
        <path d="M48 48H52" stroke="white" strokeWidth="2" />
        {/* Base */}
        <path d="M25 80H75L80 90H20L25 80Z" fill="#2d3436" />
    </svg>
);

export const QueenIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Crown */}
        <path d="M25 30L35 60L45 30L50 20L55 30L65 60L75 30L70 80H30L25 30Z" fill="#ff6b6b" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Gems */}
        <circle cx="25" cy="30" r="3" fill="#feca57" stroke="#2d3436" strokeWidth="2" />
        <circle cx="50" cy="20" r="3" fill="#feca57" stroke="#2d3436" strokeWidth="2" />
        <circle cx="75" cy="30" r="3" fill="#feca57" stroke="#2d3436" strokeWidth="2" />
        {/* Face */}
        <circle cx="42" cy="55" r="3" fill="#2d3436" />
        <circle cx="58" cy="55" r="3" fill="#2d3436" />
        {/* Base */}
        <path d="M25 80H75L80 90H20L25 80Z" fill="#2d3436" />
    </svg>
);

export const KingIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Crown/Body */}
        <path d="M30 40V80H70V40L60 25H40L30 40Z" fill="#feca57" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Cross */}
        <path d="M50 10V25M42 18H58" stroke="#2d3436" strokeWidth="4" strokeLinecap="round" />
        {/* Face */}
        <circle cx="45" cy="50" r="3" fill="#2d3436" />
        <circle cx="55" cy="50" r="3" fill="#2d3436" />
        <path d="M48 55H52" stroke="#2d3436" strokeWidth="2" />
        {/* Base */}
        <path d="M25 80H75L80 90H20L25 80Z" fill="#2d3436" />
    </svg>
);

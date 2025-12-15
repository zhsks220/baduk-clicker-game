import React from 'react';

// Common props
interface IconProps {
    className?: string;
    style?: React.CSSProperties;
}

// 2D Casual SD Style (Expression Update)
// User Reference: King(Angry), Queen(Smug), Bishop(Crying), Knight(Crazy), Rook(Angry), Pawn(Scared).
// Style Guide: Stroke Width 2px, Faces on Top.

// Style constants (currently using inline styles)
// const FACE_STYLE = { fill: "black", stroke: "none" };
// const MOUTH_STYLE = { stroke: "black", strokeWidth: 1.5, fill: "white", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
// const TEAR_STYLE = { fill: "#00a8ff", stroke: "none" };

export const PawnIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* White Pawn - Round Head, Collar, Trapezoid Body */}
            <path d="M35 75H65L70 85H30L35 75Z" fill="#f5f6fa" />
            <path d="M40 75L42 45H58L60 75H40Z" fill="#f5f6fa" />
            <path d="M40 45H60L62 40H38L40 45Z" fill="#f5f6fa" />
            <circle cx="50" cy="25" r="15" fill="#f5f6fa" />
        </g>
        {/* Face: Scared/Shocked (Wide Eyes, Open Mouth) */}
        <circle cx="44" cy="24" r="2.5" fill="white" stroke="black" strokeWidth="1" />
        <circle cx="44" cy="24" r="1" fill="black" />

        <circle cx="56" cy="24" r="2.5" fill="white" stroke="black" strokeWidth="1" />
        <circle cx="56" cy="24" r="1" fill="black" />

        {/* Mouth: Open O */}
        <circle cx="50" cy="32" r="3" fill="black" />
        <circle cx="50" cy="32" r="1" fill="#e17055" />
    </svg>
);

export const KnightIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Yellow Knight */}
            <path d="M30 75H70L75 85H25L30 75Z" fill="#feca57" />
            <path d="M35 75L35 55H65L65 75H35Z" fill="#feca57" />
            <path d="M35 55L35 30L55 15L75 25L70 45L60 45L60 55H35Z" fill="#feca57" />
            <path d="M35 30L25 35L35 40L25 45L35 50" fill="none" />
        </g>
        {/* Face: Crazy Grin */}
        <circle cx="55" cy="28" r="4" fill="white" stroke="black" strokeWidth="1.5" />
        <circle cx="55" cy="28" r="1.5" fill="black" />

        {/* Grin with teeth */}
        <path d="M60 40Q65 40 70 38Q72 45 60 45" fill="white" stroke="black" strokeWidth="1.5" />
        <path d="M62 40V44M65 39V44M68 39V43" stroke="black" strokeWidth="1" />
    </svg>
);

export const BishopIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Blue Bishop - Pen Nib */}
            <path d="M30 75H70L75 85H25L30 75Z" fill="#54a0ff" />
            <path d="M35 75L38 50H62L65 75H35Z" fill="#54a0ff" />
            <path d="M38 50L40 25C40 25 45 10 50 10C55 10 60 25 60 25L62 50H38Z" fill="#54a0ff" />
            <line x1="50" y1="10" x2="50" y2="35" strokeWidth="2" />
            <circle cx="50" cy="35" r="1.5" fill="white" stroke="none" />
        </g>
        {/* Face: Crying (Tears < > Mouth ~) */}
        {/* Eyes: Closed/Crying */}
        <path d="M42 30L46 32" stroke="black" strokeWidth="1.5" />
        <path d="M58 30L54 32" stroke="black" strokeWidth="1.5" />

        {/* Tears */}
        <path d="M42 34Q42 38 43 40Q45 38 42 34Z" fill="#00a8ff" />
        <path d="M58 34Q58 38 57 40Q55 38 58 34Z" fill="#00a8ff" />

        {/* Mouth: Squiggly */}
        <path d="M46 38Q48 36 50 38Q52 40 54 38" stroke="black" strokeWidth="1.5" fill="none" />
    </svg>
);

export const RookIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Purple Rook */}
            <path d="M30 75H70L75 85H25L30 75Z" fill="#5f27cd" />
            <path d="M35 75L35 35H65L65 75H35Z" fill="#5f27cd" />
            <path d="M32 35V20H40V25H45V20H55V25H60V20H68V35H32Z" fill="#5f27cd" />
        </g>
        {/* Face: Angry (Gritting Teeth) */}
        {/* Eyebrows */}
        <path d="M40 50L46 54" stroke="black" strokeWidth="2" />
        <path d="M60 50L54 54" stroke="black" strokeWidth="2" />
        {/* Eyes */}
        <circle cx="45" cy="56" r="1.5" fill="black" />
        <circle cx="55" cy="56" r="1.5" fill="black" />
        {/* Mouth: Rectangle Grit */}
        <rect x="44" y="60" width="12" height="4" rx="1" fill="white" stroke="black" strokeWidth="1" />
        <line x1="44" y1="62" x2="56" y2="62" stroke="black" strokeWidth="1" />
        <line x1="48" y1="60" x2="48" y2="64" stroke="black" strokeWidth="1" />
        <line x1="52" y1="60" x2="52" y2="64" stroke="black" strokeWidth="1" />
    </svg>
);

export const QueenIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Pink Queen */}
            <path d="M30 75H70L75 85H25L30 75Z" fill="#ff9ff3" />
            <path d="M38 75L42 50H58L62 75H38Z" fill="#ff9ff3" />
            <path d="M42 50L35 30L45 35L50 20L55 35L65 30L58 50H42Z" fill="#ff9ff3" />
            <circle cx="50" cy="15" r="3" fill="#ff9ff3" />
        </g>
        {/* Face: Smug (Confident Smile) */}
        {/* Eyes: Sharp/Lashed */}
        <path d="M42 40L46 38L48 40" stroke="black" strokeWidth="1.5" fill="none" />
        <path d="M52 40L54 38L58 40" stroke="black" strokeWidth="1.5" fill="none" />

        {/* Mouth: Smirk D */}
        <path d="M45 44H55Q55 49 50 49Q45 49 45 44Z" fill="white" stroke="black" strokeWidth="1.5" />
    </svg>
);

export const KingIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Green King */}
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 75H70L75 85H25L30 75Z" fill="#2ecc71" />
            <path d="M35 75L40 50H60L65 75H35Z" fill="#2ecc71" />
            <path d="M40 50L35 30L45 30L50 20L55 30L65 30L60 50H40Z" fill="#2ecc71" />
            <path d="M50 5V18M45 12H55" strokeWidth="2" />
        </g>
        {/* Face: Angry (Gritting) - High up */}
        {/* Eyebrows */}
        <path d="M40 33L46 37" stroke="black" strokeWidth="1.5" />
        <path d="M60 33L54 37" stroke="black" strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="45" cy="38" r="1.5" fill="black" />
        <circle cx="55" cy="38" r="1.5" fill="black" />
        {/* Mouth: Gritting Teeth */}
        <rect x="44" y="42" width="12" height="4" rx="1" fill="white" stroke="black" strokeWidth="1" />
        <line x1="44" y1="44" x2="56" y2="44" stroke="black" strokeWidth="1" />
        <line x1="48" y1="42" x2="48" y2="46" stroke="black" strokeWidth="1" />
        <line x1="52" y1="42" x2="52" y2="46" stroke="black" strokeWidth="1" />
    </svg>
);

export const ImperialKingIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="imperialRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="20%" stopColor="#ffa500" />
                <stop offset="40%" stopColor="#ffff00" />
                <stop offset="60%" stopColor="#008000" />
                <stop offset="80%" stopColor="#0000ff" />
                <stop offset="100%" stopColor="#4b0082" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* Aura */}
        <circle cx="50" cy="50" r="48" fill="url(#imperialRainbow)" opacity="0.4" filter="url(#glow)" />

        <g stroke="url(#imperialRainbow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {/* Body */}
            <path d="M30 75H70L75 85H25L30 75Z" fill="#f1c40f" />
            <path d="M35 75L40 50H60L65 75H35Z" fill="#f1c40f" />
            {/* Head - Mecha Style */}
            <path d="M35 50L30 20L42 30L50 10L58 30L70 20L65 50H35Z" fill="#f1c40f" />
            {/* V-Fin */}
            <path d="M50 10L30 0M50 10L70 0" strokeWidth="2" />
        </g>
        {/* Face - Mecha Eyes */}
        <path d="M40 35L48 40" stroke="#e74c3c" strokeWidth="2" />
        <path d="M60 35L52 40" stroke="#e74c3c" strokeWidth="2" />
        {/* Red Eyes */}
        <circle cx="46" cy="42" r="2" fill="#ff0000" stroke="none" />
        <circle cx="54" cy="42" r="2" fill="#ff0000" stroke="none" />

        <circle cx="50" cy="25" r="3" fill="#2ecc71" stroke="white" strokeWidth="1" />
    </svg>
);

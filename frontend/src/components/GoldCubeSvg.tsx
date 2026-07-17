import React from "react";

export function HeroCoinsCube({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gold Gradients */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#dfa552" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dfa552" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#dfa552" stopOpacity="0.2" />
        </linearGradient>
        {/* Glass Face Gradients */}
        <linearGradient id="topFace" x1="120" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#221e1a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0a0908" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="leftFace" x1="50" y1="80" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a1613" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#080706" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="rightFace" x1="120" y1="120" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151210" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050404" stopOpacity="0.95" />
        </linearGradient>
        {/* Glow Filters */}
        <filter id="goldEdgeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* Floating Shadow */}
      <ellipse cx="120" cy="210" rx="60" ry="12" fill="#000000" filter="blur(8px)" opacity="0.6" />

      {/* Cube Body with shadow */}
      <g filter="url(#shadowFilter)">
        {/* Glass Faces */}
        {/* Top Face */}
        <path d="M 120 45 L 195 85 L 120 125 L 45 85 Z" fill="url(#topFace)" />
        {/* Left Face */}
        <path d="M 45 85 L 120 125 L 120 200 L 45 160 Z" fill="url(#leftFace)" />
        {/* Right Face */}
        <path d="M 120 125 L 195 85 L 195 160 L 120 200 Z" fill="url(#rightFace)" />

        {/* Embossed Coins Icon on Top Face (projected & styled in gold) */}
        <g transform="translate(0, -5)">
          {/* Bottom coin base */}
          <path d="M 100 86 C 100 90 120 95 140 91 C 140 87 140 87 140 87" stroke="url(#goldGrad)" strokeWidth="2.5" fill="url(#goldGlow)" />
          <path d="M 100 86 L 100 91 C 100 95 120 100 140 96 L 140 91" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />
          
          {/* Middle coin */}
          <path d="M 100 80 C 100 84 120 89 140 85 C 140 81 140 81 140 81" stroke="url(#goldGrad)" strokeWidth="2.5" fill="url(#goldGlow)" />
          <path d="M 100 80 L 100 85 C 100 89 120 94 140 90 L 140 85" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />

          {/* Top coin cap */}
          <ellipse cx="120" cy="74" rx="20" ry="8" fill="url(#goldGlow)" stroke="url(#goldGrad)" strokeWidth="2.5" />
          
          {/* Dollar symbol inside top coin (skewed) */}
          <path d="M 120 70 L 120 78 M 117 72 C 115 72 115 74 117 75 C 120 76 123 75 123 77 C 123 78 120 78 117 78" stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Glowing Gold Edges */}
        {/* Outer Edges */}
        <path d="M 120 45 L 195 85 L 195 160 L 120 200 L 45 160 L 45 85 Z" stroke="url(#goldGrad)" strokeWidth="2" strokeLinejoin="round" filter="url(#goldEdgeGlow)" />
        {/* Inner Edges */}
        <path d="M 120 125 L 45 85 M 120 125 L 195 85 M 120 125 L 120 200" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.7" />
      </g>
    </svg>
  );
}

export function ShieldSecurityCube({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#dfa552" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dfa552" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#dfa552" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="topFace" x1="120" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#221e1a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0a0908" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="leftFace" x1="50" y1="80" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a1613" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#080706" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="rightFace" x1="120" y1="120" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151210" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050404" stopOpacity="0.95" />
        </linearGradient>
        <filter id="goldEdgeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* Floating Shadow */}
      <ellipse cx="120" cy="210" rx="60" ry="12" fill="#000000" filter="blur(8px)" opacity="0.6" />

      {/* Cube Body with shadow */}
      <g filter="url(#shadowFilter)">
        {/* Glass Faces */}
        <path d="M 120 45 L 195 85 L 120 125 L 45 85 Z" fill="url(#topFace)" />
        <path d="M 45 85 L 120 125 L 120 200 L 45 160 Z" fill="url(#leftFace)" />
        <path d="M 120 125 L 195 85 L 195 160 L 120 200 Z" fill="url(#rightFace)" />

        {/* Embossed Shield Icon on Top Face */}
        <g transform="translate(0, -4)">
          {/* Shield outline skewed to isometric perspective */}
          <path
            d="M 120 66 L 138 72 C 138 72 138 88 120 98 C 102 88 102 72 102 72 Z"
            fill="url(#goldGlow)"
            stroke="url(#goldGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Small padlock inside shield */}
          <rect x="115" y="79" width="10" height="8" rx="1.5" fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" />
          <path d="M 117 79 V 76 A 3 3 0 0 1 123 76 V 79" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" />
        </g>

        {/* Glowing Gold Edges */}
        <path d="M 120 45 L 195 85 L 195 160 L 120 200 L 45 160 L 45 85 Z" stroke="url(#goldGrad)" strokeWidth="2" strokeLinejoin="round" filter="url(#goldEdgeGlow)" />
        <path d="M 120 125 L 45 85 M 120 125 L 195 85 M 120 125 L 120 200" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.7" />
      </g>
    </svg>
  );
}

export function ContractCube({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#dfa552" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dfa552" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#dfa552" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="topFace" x1="120" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#221e1a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0a0908" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="leftFace" x1="50" y1="80" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a1613" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#080706" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="rightFace" x1="120" y1="120" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151210" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050404" stopOpacity="0.95" />
        </linearGradient>
        <filter id="goldEdgeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* Floating Shadow */}
      <ellipse cx="120" cy="210" rx="60" ry="12" fill="#000000" filter="blur(8px)" opacity="0.6" />

      {/* Cube Body with shadow */}
      <g filter="url(#shadowFilter)">
        {/* Glass Faces */}
        <path d="M 120 45 L 195 85 L 120 125 L 45 85 Z" fill="url(#topFace)" />
        <path d="M 45 85 L 120 125 L 120 200 L 45 160 Z" fill="url(#leftFace)" />
        <path d="M 120 125 L 195 85 L 195 160 L 120 200 Z" fill="url(#rightFace)" />

        {/* Embossed Recurring Payment Icon on Top Face */}
        <g transform="translate(0, -4)">
          {/* Outer ring circular arrow paths (skewed in isometric projection) */}
          <path
            d="M 104 80 C 104 74 112 70 120 70 C 128 70 136 74 136 80 C 136 86 128 90 120 90"
            stroke="url(#goldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Arrow heads */}
          <path d="M 100 81 L 105 81 L 105 76" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 124 93 L 119 93 L 119 88" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          
          {/* Center sync/vault dollar icon */}
          <path d="M 120 75 V 85 M 117 77 C 115 77 115 79 117 80 C 120 81 123 80 123 82 C 123 83 120 83 117 83" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Glowing Gold Edges */}
        <path d="M 120 45 L 195 85 L 195 160 L 120 200 L 45 160 L 45 85 Z" stroke="url(#goldGrad)" strokeWidth="2" strokeLinejoin="round" filter="url(#goldEdgeGlow)" />
        <path d="M 120 125 L 45 85 M 120 125 L 195 85 M 120 125 L 120 200" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.7" />
      </g>
    </svg>
  );
}

import React from 'react';

interface BeeLogoProps {
  className?: string;
  size?: number;
}

export const BeeLogo: React.FC<BeeLogoProps> = ({ className = 'w-6 h-6', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 165"
      className={className}
      style={style}
      fill="none"
      aria-label="Salto Ángel Spelling Bee Logo"
    >
      <defs>
        <filter id="bee-poly-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#bee-poly-shadow)">
        {/* ==================== LEFT WINGS ==================== */}
        {/* Left Upper Wing - Facet 1 (Top / Lightest Ice-White) */}
        <polygon points="9,54 60,41 89,50 56,66" fill="#F4F7FB" />

        {/* Left Upper Wing - Facet 2 (Middle / Crystal Ice Blue) */}
        <polygon points="9,54 56,66 89,50 87,70 60,78" fill="#C5D7E2" />

        {/* Left Upper Wing - Facet 3 (Bottom / Shadow Steel Blue) */}
        <polygon points="9,54 60,78 87,70 57,96" fill="#7EA7BE" />

        {/* Left Lower Wing - Facet 1 (Upper Light) */}
        <polygon points="87,82 57,96 50,129 76,112" fill="#D3E2EB" />

        {/* Left Lower Wing - Facet 2 (Lower Shadow) */}
        <polygon points="87,82 76,112 50,129 78,126" fill="#82A7BC" />


        {/* ==================== RIGHT WINGS ==================== */}
        {/* Right Upper Wing - Facet 1 (Top / Lightest Ice-White) */}
        <polygon points="203,54 152,41 123,50 156,66" fill="#F4F7FB" />

        {/* Right Upper Wing - Facet 2 (Middle / Crystal Ice Blue) */}
        <polygon points="203,54 156,66 123,50 125,70 152,78" fill="#C5D7E2" />

        {/* Right Upper Wing - Facet 3 (Bottom / Shadow Steel Blue) */}
        <polygon points="203,54 152,78 125,70 155,96" fill="#7EA7BE" />

        {/* Right Lower Wing - Facet 1 (Upper Light) */}
        <polygon points="125,82 155,96 162,129 136,112" fill="#D3E2EB" />

        {/* Right Lower Wing - Facet 2 (Lower Shadow) */}
        <polygon points="125,82 136,112 162,129 134,126" fill="#82A7BC" />


        {/* ==================== LEGS & ANTENNAE ==================== */}
        {/* Left Antenna */}
        <path d="M101,38 Q90,26 80,21 Q76,23 81,27 Q88,32 99,41 Z" fill="#FCC04E" />

        {/* Right Antenna */}
        <path d="M111,38 Q122,26 132,21 Q136,23 131,27 Q124,32 113,41 Z" fill="#E28F33" />

        {/* Left Front Leg */}
        <path d="M89,45 Q74,38 64,52 Q60,62 70,64 Q74,58 84,54 Z" fill="#FCC04E" />

        {/* Right Front Leg */}
        <path d="M123,45 Q138,38 148,52 Q152,62 142,64 Q138,58 128,54 Z" fill="#E28F33" />


        {/* ==================== HEAD / EYES ==================== */}
        {/* Left Eye Lobe */}
        <polygon points="100,38 91,44 94,54 104,50" fill="#FCC64D" />

        {/* Right Eye Lobe */}
        <polygon points="112,38 121,44 118,54 108,50" fill="#E29036" />


        {/* ==================== THORAX (HEXAGON) ==================== */}
        {/* Left Half of Hexagon */}
        <polygon points="106,52 90,61 90,87 106,99 106,52" fill="#FCC04E" />

        {/* Right Half of Hexagon */}
        <polygon points="106,52 122,61 122,87 106,99 106,52" fill="#E28F33" />


        {/* ==================== ABDOMEN & STRIPES ==================== */}
        {/* Band 1 Left (Gold) */}
        <polygon points="106,98 87,97 84,106 106,106" fill="#FCC64D" />
        {/* Band 1 Right (Amber) */}
        <polygon points="106,98 125,97 128,106 106,106" fill="#E29036" />

        {/* Dark Band 1 (Navy) */}
        <polygon points="106,106 84,106 87,116 106,116" fill="#041D3B" />
        <polygon points="106,106 128,106 125,116 106,116" fill="#031730" />

        {/* Band 2 Left (Gold) */}
        <polygon points="106,116 87,116 90,126 106,126" fill="#FCC64D" />
        {/* Band 2 Right (Amber) */}
        <polygon points="106,116 125,116 122,126 106,126" fill="#E29036" />

        {/* Dark Band 2 (Navy) */}
        <polygon points="106,126 90,126 94,136 106,136" fill="#041D3B" />
        <polygon points="106,126 122,126 118,136 106,136" fill="#031730" />

        {/* Stinger / Band 3 Left (Gold Point) */}
        <polygon points="106,136 94,136 106,150" fill="#FCC64D" />
        {/* Stinger / Band 3 Right (Amber Point) */}
        <polygon points="106,136 118,136 106,150" fill="#D9882B" />
      </g>
    </svg>
  );
};

import React, { useLayoutEffect, useRef } from 'react';

// SVG text never wraps or shrinks by itself, and font metrics differ per platform (iOS "serif"
// is Times, Android/desktop differ), so a long name could run past the label edges. FitText
// measures the rendered line and, only when it is wider than the label, compresses it to fit.
const LABEL_TEXT_MAX = 118; // inner label is 128 units wide (x 36..164)
function FitText({ children, maxWidth = LABEL_TEXT_MAX, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.getComputedTextLength !== 'function') return;
    el.removeAttribute('textLength');
    el.removeAttribute('lengthAdjust');
    const fit = () => {
      el.removeAttribute('textLength');
      if (el.getComputedTextLength() > maxWidth) {
        el.setAttribute('textLength', String(maxWidth));
        el.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    };
    fit();
    if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
  }, [children, maxWidth]);
  return <text ref={ref} {...props}>{children}</text>;
}

/**
 * Photorealistic SVG & CSS Red Wine Bottle
 * Renders a luxury Bordeaux/Burgundy silhouette with realistic glass sheens,
 * foil capsule, and an authentic vintage estate label displaying the wine's actual details.
 */
export default function GenericWineBottle({
  wineName = 'CHÂTEAU MARGAUX',
  grape = 'GRAND VIN',
  vintage = '2016',
  region = 'BORDEAUX',
  alcohol = '14.0%',
  wineColorHex = '#7e1022',
  className = '',
  style = {}
}) {
  const displayName = (wineName || 'ESTATE RESERVE').toUpperCase();
  const displayGrape = (grape || 'RED WINE').toUpperCase();
  const displayVintage = vintage || new Date().getFullYear().toString();
  const displayOrigin = (region || 'FINE WINE').toUpperCase();

  return (
    <div
      className={`generic-wine-bottle-wrap ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        margin: '0 auto',
        filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.35))',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 200 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Glass & Wine Fluid Gradients */}
          <linearGradient id="bottleBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#15080c" />
            <stop offset="12%" stopColor="#2c0e18" />
            <stop offset="35%" stopColor={wineColorHex || '#661224'} />
            <stop offset="60%" stopColor="#1a070f" />
            <stop offset="85%" stopColor="#2c0e18" />
            <stop offset="100%" stopColor="#0d0407" />
          </linearGradient>

          <linearGradient id="glassSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="28%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="34%" stopColor="rgba(255,255,255,0.38)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="75%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="88%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Capsule / Foil Gradients */}
          <linearGradient id="capsuleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#403237" />
            <stop offset="20%" stopColor="#69565d" />
            <stop offset="45%" stopColor="#967e88" />
            <stop offset="65%" stopColor="#57464d" />
            <stop offset="100%" stopColor="#2e2327" />
          </linearGradient>

          <linearGradient id="capsuleCollar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a7346" />
            <stop offset="50%" stopColor="#e5cb85" />
            <stop offset="100%" stopColor="#63512b" />
          </linearGradient>

          {/* Label Texture / Parchment */}
          <linearGradient id="parchmentLabel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2dcd0" />
            <stop offset="8%" stopColor="#f5f2ea" />
            <stop offset="50%" stopColor="#faf8f3" />
            <stop offset="92%" stopColor="#eee9dd" />
            <stop offset="100%" stopColor="#ded7c9" />
          </linearGradient>

          {/* Contact Ground Shadow */}
          <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="60%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* Contact Shadow under Bottle Base */}
        <ellipse cx="100" cy="665" rx="75" ry="12" fill="url(#groundShadow)" />

        {/* Bottle Body Path */}
        {/* Dimensions: Lip 84-116 (w=32) at y=20..42, Neck w=36 at y=42..150, Shoulders widen to w=156 at y=235, Trunk w=156 down to y=650 */}
        <path
          d="
            M 82 24
            L 118 24
            Q 120 24, 120 28
            L 120 38
            Q 120 42, 118 42
            L 117 44
            L 117 150
            C 117 195, 178 225, 178 275
            L 178 642
            Q 178 654, 168 654
            L 32 654
            Q 22 654, 22 642
            L 22 275
            C 22 225, 83 195, 83 150
            L 83 44
            L 82 42
            Q 80 42, 80 38
            L 80 28
            Q 80 24, 82 24
            Z
          "
          fill="url(#bottleBodyGrad)"
          stroke="#261017"
          strokeWidth="2"
        />

        {/* Foil Capsule on Neck */}
        <path
          d="
            M 81 24
            L 119 24
            L 119 40
            L 118 42
            L 118 122
            C 118 126, 82 126, 82 122
            L 82 42
            L 81 40
            Z
          "
          fill="url(#capsuleGrad)"
        />

        {/* Capsule Gold Ring Accent */}
        <line x1="82" y1="116" x2="118" y2="116" stroke="url(#capsuleCollar)" strokeWidth="3" />
        <line x1="80" y1="42" x2="120" y2="42" stroke="url(#capsuleCollar)" strokeWidth="2.5" />

        {/* Glass Sheen / Specular Highlights Overlay */}
        <path
          d="
            M 82 24
            L 118 24
            L 118 150
            C 118 195, 178 225, 178 275
            L 178 642
            L 22 642
            L 22 275
            C 22 225, 83 195, 83 150
            L 83 24
            Z
          "
          fill="url(#glassSpecular)"
        />

        {/* ===================================================
            AUTHENTIC RECTANGULAR ESTATE WINE LABEL
           =================================================== */}
        {/* Label Background with soft cylinder shadow curve */}
        <rect
          x="28"
          y="310"
          width="144"
          height="195"
          rx="3"
          fill="url(#parchmentLabel)"
          stroke="#423429"
          strokeWidth="0.8"
          style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))' }}
        />

        {/* Inner Gold Filigree Label Border */}
        <rect
          x="33"
          y="315"
          width="134"
          height="185"
          rx="2"
          fill="none"
          stroke="#b8934a"
          strokeWidth="1"
          strokeDasharray="none"
        />
        <rect
          x="36"
          y="318"
          width="128"
          height="179"
          rx="1"
          fill="none"
          stroke="#b8934a"
          strokeWidth="0.5"
        />

        {/* Gold Estate Medallion Emblem */}
        <circle cx="100" cy="346" r="14" fill="none" stroke="#b8934a" strokeWidth="1.2" />
        <circle cx="100" cy="346" r="11" fill="none" stroke="#b8934a" strokeWidth="0.6" strokeDasharray="2,2" />
        <text
          x="100"
          y="350"
          textAnchor="middle"
          fill="#8c6d2d"
          fontFamily="serif"
          fontSize="10"
          fontWeight="bold"
        >
          ✦
        </text>

        {/* "GRAND VIN" or Origin Subtitle */}
        <FitText
          x="100"
          y="374"
          textAnchor="middle"
          fill="#5a493b"
          fontFamily="serif"
          fontSize="7"
          letterSpacing="0.18em"
          fontWeight="bold"
        >
          {displayOrigin}
        </FitText>

        {/* Wine Main Title (Auto-wrapped or sized) */}
        <FitText
          x="100"
          y="396"
          textAnchor="middle"
          fill="#1c1317"
          fontFamily="serif"
          fontSize={displayName.length > 20 ? '9.5' : '11.5'}
          fontWeight="900"
          letterSpacing="0.08em"
        >
          {displayName.length > 24 ? displayName.substring(0, 22) + '...' : displayName}
        </FitText>

        {/* Grape Variety */}
        <FitText
          x="100"
          y="412"
          textAnchor="middle"
          fill="#6b5749"
          fontFamily="serif"
          fontSize="8"
          letterSpacing="0.12em"
          fontWeight="600"
        >
          {displayGrape}
        </FitText>

        {/* Fine Line Divider */}
        <line x1="55" y1="424" x2="145" y2="424" stroke="#b8934a" strokeWidth="0.75" />

        {/* Vintage Year */}
        <text
          x="100"
          y="445"
          textAnchor="middle"
          fill="#8c2337"
          fontFamily="serif"
          fontSize="17"
          fontWeight="900"
          letterSpacing="0.14em"
        >
          {displayVintage}
        </text>

        {/* Alcohol & Volume Fine Print */}
        <text
          x="100"
          y="464"
          textAnchor="middle"
          fill="#6b5c50"
          fontFamily="sans-serif"
          fontSize="6"
          letterSpacing="0.05em"
          fontWeight="500"
        >
          MIS EN BOUTEILLE AU DOMAINE
        </text>

        <FitText
          x="100"
          y="478"
          textAnchor="middle"
          fill="#7d6d60"
          fontFamily="sans-serif"
          fontSize="5.5"
          letterSpacing="0.08em"
        >
          {alcohol || '14.0%'} alc./vol. • 750 ML
        </FitText>

        {/* Bottom Curved Base Shadow & Highlight */}
        <path
          d="M 24 642 Q 100 658, 176 642 L 176 646 Q 100 662, 24 646 Z"
          fill="rgba(0,0,0,0.6)"
        />
        <path
          d="M 32 642 Q 100 655, 168 642"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}

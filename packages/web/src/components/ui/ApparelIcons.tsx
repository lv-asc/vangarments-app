import React from 'react';
import {
    Backpack,
    Tag,
} from 'lucide-react';

export type ApparelIconType =
    | 't-shirt' | 'polo' | 'shirt' | 'baby tee' | 'tank' | 'jersey' | 'hoodie' | 'sweater' | 'crewneck' | 'turtle' | 'vest'
    | 'jacket' | 'windbreaker' | 'puffer' | 'bomber' | 'varsity' | 'leather'
    | 'jeans' | 'pants' | 'shorts' | 'sweatpants' | 'cargo' | 'tailored' | 'jorts' | 'sweatshorts'
    | 'jumpsuit' | 'overalls' | 'tracksuit' | 'dress'
    | 'bag' | 'duffle' | 'tote' | 'shoulder' | 'sling' | 'handle' | 'travel'
    | 'hat' | 'cap' | 'beanie' | 'bucket' | 'trucker'
    | 'belt' | 'wallet' | 'card holder' | 'gloves'
    | 'watch' | 'glasses' | 'sunglasses' | 'ring' | 'necklace';

interface ApparelIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    icon?: string;
    className?: string;
    strokeWidth?: number;
}

// ============== TOPS ==============

// Realistic T-Shirt with collar and sleeves
const TShirtIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Body */}
        <path d="M6 9v12a1 1 0 001 1h10a1 1 0 001-1V9" />
        {/* Shoulders and sleeves */}
        <path d="M6 9L3 6.5V4l5-2h8l5 2v2.5L18 9" />
        {/* Collar */}
        <path d="M9.5 2c0 1.5 1.12 2.5 2.5 2.5s2.5-1 2.5-2.5" />
        {/* Sleeve hems */}
        <path d="M3 5.5l3 3.5" />
        <path d="M21 5.5l-3 3.5" />
    </svg>
);

// Hoodie with hood, pocket, and drawstrings
const HoodieIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Hood */}
        <path d="M8 2c-2 0-3.5 2-3.5 4.5S6 10 8 10h8c2 0 3.5-1.5 3.5-3.5S18 2 16 2" />
        {/* Body */}
        <path d="M5 10v11a1 1 0 001 1h12a1 1 0 001-1V10" />
        {/* Sleeves */}
        <path d="M5 10L2 7V5l3-1" />
        <path d="M19 10l3-3V5l-3-1" />
        {/* Kangaroo pocket */}
        <path d="M8 16h8v4H8z" />
        {/* Center seam */}
        <path d="M12 10v12" />
        {/* Drawstrings */}
        <path d="M10 10v2" />
        <path d="M14 10v2" />
    </svg>
);

// Realistic jacket with collar, zipper, pockets
const JacketIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Collar */}
        <path d="M9 2l3 3 3-3" />
        {/* Shoulders */}
        <path d="M9 2L5 4l-2 3v2l3 2" />
        <path d="M15 2l4 2 2 3v2l-3 2" />
        {/* Body */}
        <path d="M6 11v10a1 1 0 001 1h10a1 1 0 001-1V11" />
        {/* Zipper */}
        <path d="M12 5v17" />
        {/* Pockets */}
        <path d="M7 15h3v3H7z" />
        <path d="M14 15h3v3h-3z" />
    </svg>
);

// Polo shirt with collar and buttons
const PoloIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Body */}
        <path d="M6 9v12a1 1 0 001 1h10a1 1 0 001-1V9" />
        {/* Shoulders */}
        <path d="M6 9L3 6V4l5-2h8l5 2v2l-3 3" />
        {/* Collar */}
        <path d="M9 2v3l3 2 3-2V2" />
        {/* Placket */}
        <path d="M12 7v8" />
        <circle cx="12" cy="9" r="0.5" fill="currentColor" />
        <circle cx="12" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
);

// Sweater with ribbed cuffs
const SweaterIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Body */}
        <path d="M6 8v13a1 1 0 001 1h10a1 1 0 001-1V8" />
        {/* Shoulders and sleeves */}
        <path d="M6 8L2 5v3l4 4" />
        <path d="M18 8l4-3v3l-4 4" />
        {/* Collar area */}
        <path d="M6 8c0-3 2.7-6 6-6s6 3 6 6" />
        {/* Neckline */}
        <path d="M9.5 5c0 1.5 1.12 2.5 2.5 2.5s2.5-1 2.5-2.5" />
        {/* Ribbed bottom */}
        <path d="M7 20h10" />
        <path d="M7 21h10" />
    </svg>
);

// Tank top
const TankIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Straps */}
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        {/* Body */}
        <path d="M6 6c0 0-1 3-1 5v10a1 1 0 001 1h12a1 1 0 001-1V11c0-2-1-5-1-5" />
        {/* Neckline */}
        <path d="M8 6c0 0 2 1 4 1s4-1 4-1" />
        {/* Armholes */}
        <path d="M6 6c-1 0-1.5 2-1.5 4" />
        <path d="M18 6c1 0 1.5 2 1.5 4" />
    </svg>
);

// Vest
const VestIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Shoulders */}
        <path d="M7 3L5 5v16a1 1 0 001 1h12a1 1 0 001-1V5l-2-2" />
        {/* V-neck */}
        <path d="M7 3l5 7 5-7" />
        {/* Button line */}
        <path d="M12 10v12" />
        {/* Armholes */}
        <path d="M5 5c-2 1-2 4-2 6" />
        <path d="M19 5c2 1 2 4 2 6" />
    </svg>
);

// ============== BOTTOMS ==============

// Realistic pants with waistband, fly, tapered legs
const PantsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Waistband */}
        <path d="M5 3h14a1 1 0 011 1v1H4V4a1 1 0 011-1z" />
        {/* Left leg */}
        <path d="M4 5l1 17h4l1-9" />
        {/* Right leg */}
        <path d="M20 5l-1 17h-4l-1-9" />
        {/* Fly */}
        <path d="M12 5v5" />
        {/* Belt loops */}
        <rect x="6" y="3" width="1" height="2" fill="currentColor" />
        <rect x="11.5" y="3" width="1" height="2" fill="currentColor" />
        <rect x="17" y="3" width="1" height="2" fill="currentColor" />
    </svg>
);

// Jeans with stitching detail
const JeansIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Waistband */}
        <path d="M5 3h14a1 1 0 011 1v1H4V4a1 1 0 011-1z" />
        {/* Left leg */}
        <path d="M4 5l1 17h4l1-9" />
        {/* Right leg */}
        <path d="M20 5l-1 17h-4l-1-9" />
        {/* Fly with button */}
        <path d="M12 5v5" />
        <circle cx="12" cy="6" r="0.7" fill="currentColor" />
        {/* Pocket stitching */}
        <path d="M6 6c2 0 3 2 3 3" strokeDasharray="2 1" />
        <path d="M18 6c-2 0-3 2-3 3" strokeDasharray="2 1" />
    </svg>
);

// Shorts with proper proportions
const ShortsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Waistband */}
        <path d="M4 4h16a1 1 0 011 1v2H3V5a1 1 0 011-1z" />
        {/* Left leg */}
        <path d="M3 7l1.5 10h5l1.5-7" />
        {/* Right leg */}
        <path d="M21 7l-1.5 10h-5l-1.5-7" />
        {/* Center seam */}
        <path d="M12 7v3" />
        {/* Cuffs */}
        <path d="M4.5 16h5" />
        <path d="M14.5 16h5" />
    </svg>
);

// Skirt - A-line style
const SkirtIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Waistband */}
        <path d="M6 4h12a1 1 0 011 1v1H5V5a1 1 0 011-1z" />
        {/* A-line body */}
        <path d="M5 6l-2 15a1 1 0 001 1h16a1 1 0 001-1l-2-15" />
        {/* Center pleat */}
        <path d="M12 6v15" />
        {/* Side pleats */}
        <path d="M8 8v10" strokeOpacity="0.5" />
        <path d="M16 8v10" strokeOpacity="0.5" />
    </svg>
);

// ============== ONE-PIECE ==============

// Dress with bodice and flared skirt
const DressIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Straps */}
        <path d="M9 2v2" />
        <path d="M15 2v2" />
        {/* Neckline */}
        <path d="M9 4c0 0 1.5 1 3 1s3-1 3-1" />
        {/* Bodice */}
        <path d="M7 4v6c0 1 1 2 5 2s5-1 5-2V4" />
        {/* Waist */}
        <path d="M7 10l-3 12h16l-3-12" />
        {/* Flare lines */}
        <path d="M8 12v8" strokeOpacity="0.4" />
        <path d="M12 12v10" />
        <path d="M16 12v8" strokeOpacity="0.4" />
    </svg>
);

// Jumpsuit with defined top and bottom
const JumpsuitIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Shoulders/straps */}
        <path d="M8 2L6 5" />
        <path d="M16 2l2 3" />
        {/* Top */}
        <path d="M6 5v5h12V5" />
        {/* Neckline */}
        <path d="M8 2h8" />
        <path d="M10 5c0 0 1 1 2 1s2-1 2-1" />
        {/* Waist/belt */}
        <path d="M6 10h12" />
        <path d="M6 11h12" />
        {/* Left leg */}
        <path d="M6 11l.5 11h4l1.5-8" />
        {/* Right leg */}
        <path d="M18 11l-.5 11h-4l-1.5-8" />
    </svg>
);

// Overalls
const OverallsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Straps */}
        <path d="M7 2l2 6" />
        <path d="M17 2l-2 6" />
        {/* Bib */}
        <path d="M8 6h8v4H8z" />
        {/* Body */}
        <path d="M5 10h14v2H5z" />
        {/* Left leg */}
        <path d="M5 12l1 10h4l2-8" />
        {/* Right leg */}
        <path d="M19 12l-1 10h-4l-2-8" />
        {/* Bib pocket */}
        <rect x="10" y="7" width="4" height="2" rx="0.5" />
    </svg>
);

// ============== ACCESSORIES - HEADWEAR ==============

// Baseball cap with realistic shape
const CapIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Crown */}
        <path d="M4 14c0-5 3.5-9 8-9s8 4 8 9" />
        {/* Brim */}
        <path d="M2 14h9c0 0 1 2 4 2s4-2 4-2h3" />
        <path d="M2 14c0 1 1 2 2 2" />
        {/* Button on top */}
        <circle cx="12" cy="5" r="0.8" fill="currentColor" />
        {/* Panel lines */}
        <path d="M12 5v9" strokeOpacity="0.4" />
        <path d="M8 7v7" strokeOpacity="0.3" />
        <path d="M16 7v7" strokeOpacity="0.3" />
    </svg>
);

// Beanie with ribbed cuff
const BeanieIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Crown */}
        <path d="M4 16c0-6 3.5-11 8-11s8 5 8 11" />
        {/* Pompom */}
        <circle cx="12" cy="4" r="2" />
        {/* Ribbed cuff */}
        <rect x="4" y="16" width="16" height="4" rx="1" />
        {/* Cuff ribs */}
        <path d="M7 16v4" strokeOpacity="0.4" />
        <path d="M10 16v4" strokeOpacity="0.4" />
        <path d="M14 16v4" strokeOpacity="0.4" />
        <path d="M17 16v4" strokeOpacity="0.4" />
    </svg>
);

// Bucket hat
const BucketHatIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Crown */}
        <path d="M6 12c0-4 2.7-7 6-7s6 3 6 7" />
        {/* Brim */}
        <ellipse cx="12" cy="14" rx="10" ry="3" />
        {/* Crown bottom */}
        <path d="M6 12h12" />
    </svg>
);

// ============== ACCESSORIES - BAGS ==============

// Tote bag with handles
const ToteIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Handles */}
        <path d="M7 8V5c0-1.5 1-3 2.5-3" />
        <path d="M17 8V5c0-1.5-1-3-2.5-3" />
        {/* Bag body */}
        <path d="M4 8h16l-1 14H5L4 8z" />
        {/* Top edge */}
        <path d="M4 8c0-1 1-1 2-1h12c1 0 2 0 2 1" />
    </svg>
);

// Shoulder bag
const ShoulderBagIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Strap */}
        <path d="M6 6c-3 0-4 3-4 5" />
        {/* Bag body */}
        <rect x="4" y="10" width="16" height="11" rx="2" />
        {/* Flap */}
        <path d="M4 12h16" />
        <path d="M6 10v-2c0-1 2-2 6-2s6 1 6 2v2" />
        {/* Clasp */}
        <circle cx="12" cy="15" r="1.5" />
    </svg>
);

// Duffle bag
const DuffleIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Main body (cylinder) */}
        <ellipse cx="12" cy="12" rx="9" ry="6" />
        {/* Ends */}
        <ellipse cx="3" cy="12" rx="1" ry="4" />
        <ellipse cx="21" cy="12" rx="1" ry="4" />
        {/* Handles */}
        <path d="M8 6c0-2 2-3 4-3s4 1 4 3" />
        <path d="M9 6h6" />
        {/* Zipper */}
        <path d="M5 12h14" strokeDasharray="2 2" />
    </svg>
);

// Wallet
const WalletIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Main body */}
        <rect x="2" y="6" width="20" height="14" rx="2" />
        {/* Fold line */}
        <path d="M2 10h20" />
        {/* Card slot */}
        <rect x="14" y="13" width="5" height="4" rx="0.5" />
        {/* Snap */}
        <circle cx="12" cy="6" r="1" fill="currentColor" />
    </svg>
);

// ============== ACCESSORIES - OTHER ==============

// Belt with realistic buckle
const BeltIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Belt strap */}
        <path d="M2 11h20v2H2z" />
        {/* Buckle frame */}
        <rect x="4" y="9" width="5" height="6" rx="1" />
        {/* Buckle prong */}
        <path d="M9 12h3" />
        {/* Belt holes */}
        <circle cx="14" cy="12" r="0.6" fill="currentColor" />
        <circle cx="16" cy="12" r="0.6" fill="currentColor" />
        <circle cx="18" cy="12" r="0.6" fill="currentColor" />
        {/* Belt end */}
        <path d="M20 11v2l2-1-2-1z" />
    </svg>
);

// Watch with band
const WatchIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Watch face */}
        <circle cx="12" cy="12" r="6" />
        {/* Inner circle */}
        <circle cx="12" cy="12" r="4.5" />
        {/* Top band */}
        <path d="M9 6V2h6v4" />
        {/* Bottom band */}
        <path d="M9 18v4h6v-4" />
        {/* Band holes */}
        <path d="M10 3h4" />
        <path d="M10 21h4" />
        {/* Watch hands */}
        <path d="M12 9v3l2 1.5" />
        {/* Crown */}
        <rect x="17.5" y="11" width="2" height="2" rx="0.5" />
    </svg>
);

// Sunglasses
const SunglassesIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Left lens */}
        <path d="M3 10c0-2 1-3 3-3h3c1 0 2 1 2 3v2c0 2-1 3-3 3H6c-2 0-3-1-3-3v-2z" />
        {/* Right lens */}
        <path d="M21 10c0-2-1-3-3-3h-3c-1 0-2 1-2 3v2c0 2 1 3 3 3h2c2 0 3-1 3-3v-2z" />
        {/* Bridge */}
        <path d="M11 10c0-1 .5-2 1-2s1 1 1 2" />
        {/* Temple arms */}
        <path d="M3 9l-1-2" />
        <path d="M21 9l1-2" />
    </svg>
);

// Glove
const GloveIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Palm */}
        <path d="M6 13v7a2 2 0 002 2h6a2 2 0 002-2v-5" />
        {/* Fingers */}
        <path d="M6 13V9a1 1 0 012 0v4" />
        <path d="M8 8V5a1 1 0 012 0v6" />
        <path d="M10 5V3a1 1 0 012 0v8" />
        <path d="M12 5V4a1 1 0 012 0v9" />
        {/* Thumb */}
        <path d="M16 15v-4a1 1 0 012 0v6a4 4 0 01-4 4" />
        {/* Cuff */}
        <path d="M6 20h10" />
    </svg>
);

// Ring
const RingIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Band (3D perspective) */}
        <ellipse cx="12" cy="16" rx="6" ry="3" />
        <path d="M6 16v-4c0-1.5 2.7-3 6-3s6 1.5 6 3v4" />
        {/* Gem setting */}
        <path d="M9 9l3-5 3 5" />
        <path d="M9 9h6" />
        {/* Gem facets */}
        <path d="M12 4v5" />
    </svg>
);

// Necklace
const NecklaceIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Chain */}
        <path d="M5 4c0 8 3 13 7 15 4-2 7-7 7-15" />
        {/* Pendant */}
        <path d="M12 19l-2 2 2 1 2-1-2-2z" fill="currentColor" />
        {/* Clasp area */}
        <circle cx="5" cy="4" r="1" />
        <circle cx="19" cy="4" r="1" />
    </svg>
);

// Sling bag
const SlingBagIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Strap */}
        <path d="M4 4l16 16" />
        {/* Bag body */}
        <rect x="10" y="10" width="10" height="8" rx="2" transform="rotate(-45 15 14)" />
        {/* Zipper */}
        <path d="M13 11l4 4" strokeDasharray="2 1" />
    </svg>
);

// Card holder
const CardHolderIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Main body */}
        <rect x="3" y="5" width="18" height="14" rx="2" />
        {/* Card slots */}
        <path d="M3 9h18" />
        <path d="M3 13h18" />
        {/* Card sticking out */}
        <rect x="6" y="2" width="12" height="5" rx="1" />
    </svg>
);

// Map of icon types to their components
export const ICON_MAP: Record<ApparelIconType, React.FC<any>> = {
    't-shirt': TShirtIcon,
    'polo': PoloIcon,
    'shirt': TShirtIcon,
    'baby tee': TShirtIcon,
    'tank': TankIcon,
    'jersey': TShirtIcon,
    'hoodie': HoodieIcon,
    'sweater': SweaterIcon,
    'crewneck': SweaterIcon,
    'turtle': SweaterIcon,
    'vest': VestIcon,
    'jacket': JacketIcon,
    'windbreaker': JacketIcon,
    'puffer': JacketIcon,
    'bomber': JacketIcon,
    'varsity': JacketIcon,
    'leather': JacketIcon,
    'jeans': JeansIcon,
    'pants': PantsIcon,
    'shorts': ShortsIcon,
    'sweatpants': PantsIcon,
    'cargo': PantsIcon,
    'tailored': PantsIcon,
    'jorts': ShortsIcon,
    'sweatshorts': ShortsIcon,
    'jumpsuit': JumpsuitIcon,
    'overalls': OverallsIcon,
    'tracksuit': PantsIcon,
    'dress': DressIcon,
    'skirt': SkirtIcon,
    'bag': ToteIcon,
    'duffle': DuffleIcon,
    'tote': ToteIcon,
    'shoulder': ShoulderBagIcon,
    'sling': SlingBagIcon,
    'handle': ToteIcon,
    'travel': DuffleIcon,
    'hat': CapIcon,
    'cap': CapIcon,
    'beanie': BeanieIcon,
    'bucket': BucketHatIcon,
    'trucker': CapIcon,
    'belt': BeltIcon,
    'wallet': WalletIcon,
    'card holder': CardHolderIcon,
    'gloves': GloveIcon,
    'watch': WatchIcon,
    'glasses': SunglassesIcon,
    'sunglasses': SunglassesIcon,
    'ring': RingIcon,
    'necklace': NecklaceIcon,
};

// Grouped for easier selection UI
export const ICON_GROUPS = {
    'Tops': ['t-shirt', 'hoodie', 'jacket'],
    'Bottoms': ['pants', 'shorts', 'skirt'],
    'One-Piece': ['dress', 'jumpsuit'],
    'Accessories': ['hat', 'beanie', 'belt', 'bag', 'backpack', 'wallet', 'glasses', 'watch', 'ring', 'necklace', 'gloves']
};

export const ApparelIcon: React.FC<ApparelIconProps> = ({ name, icon, className = "w-6 h-6", ...props }) => {
    // 1. Explicit icon selection
    if (icon && ICON_MAP[icon as ApparelIconType]) {
        const IconComponent = ICON_MAP[icon as ApparelIconType];
        return <IconComponent className={className} {...props} />;
    }

    // 2. Name-based matching (Backward compatibility / Auto-detect)
    const lowerName = name?.toLowerCase() || '';

    // Tops
    if (lowerName.includes('hoodie')) return <HoodieIcon className={className} {...props} />;
    if (lowerName.includes('sweater') || lowerName.includes('crewneck') || lowerName.includes('turtle') || lowerName.includes('jersey')) return <SweaterIcon className={className} {...props} />;
    if (lowerName.includes('t-shirt') || lowerName === 'tee' || lowerName.includes('baby tee')) return <TShirtIcon className={className} {...props} />;
    if (lowerName.includes('polo')) return <PoloIcon className={className} {...props} />;
    if (lowerName.includes('vest')) return <VestIcon className={className} {...props} />;
    if (lowerName.includes('top') || lowerName.includes('tank')) return <TankIcon className={className} {...props} />;

    // Outerwear
    if (lowerName.includes('jacket') || lowerName.includes('coat') || lowerName.includes('bomber') || lowerName.includes('varsity') || lowerName.includes('leather') || lowerName.includes('windbreaker') || lowerName.includes('puffer')) return <JacketIcon className={className} {...props} />;

    // Bottoms
    if (lowerName.includes('jeans')) return <JeansIcon className={className} {...props} />;
    if (lowerName.includes('pants') || lowerName.includes('trouser') || lowerName.includes('sweatpants') || lowerName.includes('cargo') || lowerName.includes('tailored') || lowerName.includes('tracksuit')) return <PantsIcon className={className} {...props} />;
    if (lowerName.includes('shorts') || lowerName.includes('jorts') || lowerName.includes('sweatshorts')) return <ShortsIcon className={className} {...props} />;
    if (lowerName.includes('skirt')) return <SkirtIcon className={className} {...props} />;

    // One-piece
    if (lowerName.includes('dress')) return <DressIcon className={className} {...props} />;
    if (lowerName.includes('jumpsuit')) return <JumpsuitIcon className={className} {...props} />;
    if (lowerName.includes('overalls')) return <OverallsIcon className={className} {...props} />;

    // Bags
    if (lowerName.includes('backpack')) return <Backpack className={className} {...props} />;
    if (lowerName.includes('duffle') || lowerName.includes('travel')) return <DuffleIcon className={className} {...props} />;
    if (lowerName.includes('tote') || lowerName.includes('shoulder') || lowerName === 'bag') return <ToteIcon className={className} {...props} />;
    if (lowerName.includes('sling')) return <SlingBagIcon className={className} {...props} />;

    // Accessories
    if (lowerName.includes('belt')) return <BeltIcon className={className} {...props} />;
    if (lowerName.includes('hat') || lowerName.includes('cap') || lowerName.includes('trucker')) return <CapIcon className={className} {...props} />;
    if (lowerName.includes('beanie')) return <BeanieIcon className={className} {...props} />;
    if (lowerName.includes('bucket')) return <BucketHatIcon className={className} {...props} />;

    if (lowerName.includes('wallet')) return <WalletIcon className={className} {...props} />;
    if (lowerName.includes('card')) return <CardHolderIcon className={className} {...props} />;
    if (lowerName.includes('glove')) return <GloveIcon className={className} {...props} />;

    // Jewelry/Eyewear
    if (lowerName.includes('watch')) return <WatchIcon className={className} {...props} />;
    if (lowerName.includes('glass') || lowerName.includes('sunglass')) return <SunglassesIcon className={className} {...props} />;
    if (lowerName.includes('ring')) return <RingIcon className={className} {...props} />;
    if (lowerName.includes('necklace')) return <NecklaceIcon className={className} {...props} />;

    // Default
    return <Tag className={className} {...props} />;
};

// ============== PATTERN ICONS ==============

export const PatternSolidIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.3" />
    </svg>
);

export const PatternStripesIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 3v18" />
        <path d="M12 3v18" />
        <path d="M17 3v18" />
    </svg>
);

export const PatternPlaidIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
    </svg>
);

export const PatternDotsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        <circle cx="16" cy="8" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
);

export const PatternCamoIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M6 8c2-1 4 1 6 0s4 1 6 0" />
        <path d="M6 14c2-1 4 1 6 0s4 1 6 0" />
        <ellipse cx="9" cy="11" rx="2" ry="1" fill="currentColor" fillOpacity="0.3" />
        <ellipse cx="15" cy="17" rx="2" ry="1" fill="currentColor" fillOpacity="0.3" />
    </svg>
);

export const PatternFloralIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 6c0 2-1.5 3-1.5 4" />
        <path d="M12 18c0-2-1.5-3-1.5-4" />
        <path d="M6 12c2 0 3-1.5 4-1.5" />
        <path d="M18 12c-2 0-3-1.5-4-1.5" />
    </svg>
);

export const PatternAbstractIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 17c3-5 7-10 10-5" />
        <circle cx="16" cy="8" r="2" />
    </svg>
);

// Pattern icon map
export const PATTERN_ICONS: Record<string, React.FC<any>> = {
    'solid': PatternSolidIcon,
    'stripes': PatternStripesIcon,
    'striped': PatternStripesIcon,
    'plaid': PatternPlaidIcon,
    'checkered': PatternPlaidIcon,
    'dots': PatternDotsIcon,
    'polka': PatternDotsIcon,
    'camo': PatternCamoIcon,
    'camouflage': PatternCamoIcon,
    'floral': PatternFloralIcon,
    'abstract': PatternAbstractIcon,
    'geometric': PatternAbstractIcon,
    'print': PatternAbstractIcon,
};

// Get pattern icon by name
export const getPatternIcon = (name: string): React.FC<any> => {
    const lowerName = name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(PATTERN_ICONS)) {
        if (lowerName.includes(key)) return icon;
    }
    return PatternSolidIcon;
};

// ============== GENDER ICONS ==============

export const GenderMaleIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="10" cy="14" r="6" />
        <path d="M20 4l-6 6" />
        <path d="M15 4h5v5" />
    </svg>
);

export const GenderFemaleIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="9" r="6" />
        <path d="M12 15v7" />
        <path d="M9 19h6" />
    </svg>
);

export const GenderUnisexIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Male symbol (smaller, top right) */}
        <circle cx="8" cy="10" r="4" />
        <path d="M15 3l-4 4" />
        <path d="M12 3h3v3" />
        {/* Female extension (bottom) */}
        <path d="M8 14v5" />
        <path d="M6 17h4" />
    </svg>
);

export const GenderKidsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Kid figure */}
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v6" />
        <path d="M9 11h6" />
        <path d="M12 14l-3 7" />
        <path d="M12 14l3 7" />
    </svg>
);

// Gender icon map
export const GENDER_ICONS: Record<string, React.FC<any>> = {
    'male': GenderMaleIcon,
    'men': GenderMaleIcon,
    'man': GenderMaleIcon,
    'masculine': GenderMaleIcon,
    'female': GenderFemaleIcon,
    'women': GenderFemaleIcon,
    'woman': GenderFemaleIcon,
    'feminine': GenderFemaleIcon,
    'unisex': GenderUnisexIcon,
    'neutral': GenderUnisexIcon,
    'all': GenderUnisexIcon,
    'kids': GenderKidsIcon,
    'children': GenderKidsIcon,
    'child': GenderKidsIcon,
    'baby': GenderKidsIcon,
};

// Get gender icon by name
export const getGenderIcon = (name: string): React.FC<any> => {
    const lowerName = name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(GENDER_ICONS)) {
        if (lowerName.includes(key)) return icon;
    }
    return GenderUnisexIcon;
};


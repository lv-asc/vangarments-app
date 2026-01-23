// Sport ORG Types
export type SportOrgType =
    | 'professional_club'
    | 'national_association'
    | 'national_olympic_committee'
    | 'esports_org'
    | 'esports_federation';

export type SurfaceEnvironment = 'indoor' | 'grass' | 'sand' | 'hardcourt' | 'ice' | 'water' | 'digital';
export type TeamFormat = '11x11' | '7x7' | '5x5' | '3x3' | '2x2' | '1x1';
export type AgeGroup = 'open' | 'senior' | 'u23' | 'u21' | 'u19' | 'u17' | 'u15' | 'academy';
export type SquadGender = 'mens' | 'womens' | 'mixed' | 'unisex';
export type ApparelLine = 'match_pro' | 'match_replica' | 'sideline' | 'travel' | 'ceremony' | 'executive';
export type ItemStatus = 'licensed' | 'fan_made' | 'sponsor_issued';

export interface PlayerInfo {
    name: string;
    gamertag?: string;
    nationality?: string;
    position?: string;
}

export interface SocialLink {
    platform: string;
    url: string;
}

export interface LogoMetadata {
    url: string;
    name?: string;
}

export interface BannerItem {
    url: string;
    positionY?: number;
}

export interface SportOrg {
    id: string;
    name: string;
    slug: string;
    orgType: SportOrgType;
    masterLogo?: string;
    logoMetadata?: LogoMetadata[];
    banner?: string;
    banners?: BannerItem[];
    primaryColor?: string;
    secondaryColor?: string;
    foundedCountry?: string;
    foundedDate?: string;
    foundedBy?: string;
    website?: string;
    description?: string;
    contactInfo?: {
        email?: string;
        phone?: string;
        address?: string;
    };
    socialLinks?: SocialLink[];
    departments?: SportDepartment[];
    createdAt: string;
    updatedAt: string;
}

export interface SportDepartment {
    id: string;
    sportOrgId: string;
    name: string;
    slug: string;
    category: 'traditional' | 'esport';
    sportType: string;
    discipline?: string;
    surfaceEnvironment?: SurfaceEnvironment;
    teamFormat?: TeamFormat;
    logo?: string;
    squads?: SportSquad[];
    sportOrg?: SportOrg;
    createdAt: string;
    updatedAt: string;
}

export interface SportSquad {
    id: string;
    sportDepartmentId: string;
    name: string;
    slug: string;
    ageGroup?: AgeGroup;
    gender?: SquadGender;
    geographyContinent?: string;
    geographyCountry?: string;
    geographyState?: string;
    geographyCity?: string;
    geographyRegion?: string;
    logo?: string;
    roster?: PlayerInfo[];
    department?: SportDepartment;
    leagues?: SquadLeague[];
    createdAt: string;
    updatedAt: string;
}

export interface SportLeague {
    id: string;
    name: string;
    slug: string;
    sportType: string;
    category: 'traditional' | 'esport';
    logo?: string;
    website?: string;
    country?: string;
    level?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SquadLeague {
    id: string;
    squadId: string;
    leagueId: string;
    season: string;
    isActive: boolean;
    league?: SportLeague;
}

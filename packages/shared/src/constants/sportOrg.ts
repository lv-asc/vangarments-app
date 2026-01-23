export const SPORT_ORG_TYPES = [
    { value: 'professional_club', label: 'Professional Club' },
    { value: 'national_association', label: 'National Association' },
    { value: 'national_olympic_committee', label: 'National Olympic Committee' },
    { value: 'esports_org', label: 'e-Sports Organization' },
    { value: 'esports_federation', label: 'e-Sports Federation' },
] as const;

export const TRADITIONAL_SPORTS = [
    'Soccer', 'Basketball', 'Tennis', 'Ice Hockey', 'Baseball',
    'Volleyball', 'Rugby', 'Cricket', 'Golf', 'Swimming',
    'Athletics', 'Gymnastics', 'Boxing', 'Wrestling', 'Cycling',
    'Martial Arts', 'Handball', 'Field Hockey', 'American Football',
] as const;

export const ESPORT_GAMES = [
    'Counter-Strike', 'League of Legends', 'Dota 2', 'Valorant',
    'Fortnite', 'Apex Legends', 'PUBG', 'Overwatch', 'Rocket League',
    'FIFA', 'Rainbow Six Siege', 'Call of Duty', 'Mobile Legends',
    'Free Fire', 'Arena of Valor',
] as const;

export const SURFACE_ENVIRONMENTS = [
    'Indoor', 'Grass', 'Sand', 'Hardcourt', 'Ice', 'Water', 'Digital'
] as const;

export const TEAM_FORMATS = [
    '11x11', '7x7', '5x5', '3x3', '2x2', '1x1'
] as const;

export const AGE_GROUPS = [
    'Open', 'Senior', 'U23', 'U21', 'U19', 'U17', 'U15', 'Academy'
] as const;

export const SQUAD_GENDERS = [
    'Mens', 'Womens', 'Mixed', 'Unisex'
] as const;

export const APPAREL_LINES = [
    { value: 'match_pro', label: 'Match (Pro/Authentic)' },
    { value: 'match_replica', label: 'Match (Replica/Stadium)' },
    { value: 'sideline', label: 'Sideline' },
    { value: 'travel', label: 'Travel & Lifestyle' },
    { value: 'ceremony', label: 'Ceremony' },
    { value: 'executive', label: 'Executive' },
] as const;

export const ITEM_STATUSES = [
    { value: 'licensed', label: 'Licensed' },
    { value: 'fan_made', label: 'Fan-Made (Unlicensed)' },
    { value: 'sponsor_issued', label: 'Official Sponsor-Issued' },
] as const;

export const SQUAD_TEMPLATES = {
    standard_academy: [
        { ageGroup: 'u15', gender: 'mens', name: 'Academy U15' },
        { ageGroup: 'u17', gender: 'mens', name: 'Academy U17' },
        { ageGroup: 'u20', gender: 'mens', name: 'Academy U20' },
    ],
    standard_pro: [
        { ageGroup: 'senior', gender: 'mens', name: "Men's Senior" },
        { ageGroup: 'senior', gender: 'womens', name: "Women's Senior" },
    ]
} as const;

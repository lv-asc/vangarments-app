-- 20260123_create_sport_orgs_system.sql
-- Implement Three-Tier Hierarchy: Parent Club -> Sport Department -> Squad
-- Plus Full League Entity System

-- Level 1: Parent Club/Institution (Umbrella Brand)
CREATE TABLE sport_orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    org_type VARCHAR(50) NOT NULL, -- professional_club, national_association, national_olympic_committee, esports_org, esports_federation
    master_logo TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    founded_country VARCHAR(100),
    founded_date DATE,
    website TEXT,
    description TEXT,
    social_links JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Level 2: Sport Department (Modality/Game)
CREATE TABLE sport_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_org_id UUID NOT NULL REFERENCES sport_orgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL, -- traditional, esport
    sport_type VARCHAR(100) NOT NULL, -- Soccer, Basketball, Counter-Strike, etc.
    discipline VARCHAR(100), -- 3x3, Futsal, FPS, MOBA, Battle Royale
    surface_environment VARCHAR(50), -- indoor, grass, sand, hardcourt, ice, water, digital
    team_format VARCHAR(20), -- 11x11, 7x7, 5x5, 3x3, 2x2, 1x1
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(sport_org_id, slug)
);

-- Level 3: Squad (Specific Competitive Team)
CREATE TABLE sport_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_department_id UUID NOT NULL REFERENCES sport_departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    age_group VARCHAR(20), -- open, senior, u23, u21, u19, u17, u15, academy
    gender VARCHAR(20), -- mens, womens, mixed, unisex
    geography_continent VARCHAR(100),
    geography_country VARCHAR(100),
    geography_state VARCHAR(100),
    geography_city VARCHAR(100),
    geography_region VARCHAR(100),
    logo TEXT,
    roster JSONB DEFAULT '[]', -- Array of player names/gamertags
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(sport_department_id, slug)
);

-- Sport Leagues (Competitions)
CREATE TABLE sport_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sport_type VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL, -- traditional, esport
    logo TEXT,
    website TEXT,
    country VARCHAR(100),
    level VARCHAR(50), -- Professional, Amateur, International
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Junction table for squad-league associations
CREATE TABLE sport_squad_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES sport_squads(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES sport_leagues(id) ON DELETE CASCADE,
    season VARCHAR(50), -- e.g., "2025/26", "Spring 2026"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(squad_id, league_id, season)
);

-- Add sport squad reference to SKU items
ALTER TABLE sku_items ADD COLUMN sport_squad_id UUID REFERENCES sport_squads(id);
ALTER TABLE sku_items ADD COLUMN jersey_number VARCHAR(10);
ALTER TABLE sku_items ADD COLUMN player_name VARCHAR(255); -- Name or Gamertag
ALTER TABLE sku_items ADD COLUMN apparel_line VARCHAR(50); -- match_pro, match_replica, sideline, travel, ceremony, executive
ALTER TABLE sku_items ADD COLUMN item_status VARCHAR(20); -- licensed, fan_made, sponsor_issued
ALTER TABLE sku_items ADD COLUMN sponsor_restriction_flag BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX idx_sport_orgs_slug ON sport_orgs(slug);
CREATE INDEX idx_sport_orgs_org_type ON sport_orgs(org_type);
CREATE INDEX idx_sport_departments_org ON sport_departments(sport_org_id);
CREATE INDEX idx_sport_departments_sport_type ON sport_departments(sport_type);
CREATE INDEX idx_sport_squads_department ON sport_squads(sport_department_id);
CREATE INDEX idx_sport_squads_age_gender ON sport_squads(age_group, gender);
CREATE INDEX idx_sport_leagues_slug ON sport_leagues(slug);
CREATE INDEX idx_sku_items_squad ON sku_items(sport_squad_id);
CREATE INDEX idx_sku_items_apparel_line ON sku_items(apparel_line);

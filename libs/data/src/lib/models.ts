export const TYPE_NAMES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type TypeName = (typeof TYPE_NAMES)[number];

/** The small record every sticker needs. Kept compact because the whole catalog is cached locally. */
export interface PokemonSummary {
  id: number;
  slug: string;
  name: string;
  types: TypeName[];
}

export interface Stat {
  key: string;
  label: string;
  value: number;
}

export interface Ability {
  name: string;
  hidden: boolean;
  effect: string;
}

export interface EvolutionStep extends Pick<
  PokemonSummary,
  'id' | 'slug' | 'name'
> {
  how: string;
}

export interface FormVariety {
  id: number;
  name: string;
}

export interface Matchup {
  type: TypeName;
  multiplier: number;
}

export interface PokemonDetail extends PokemonSummary {
  nameJa: string;
  genus: string;
  flavor: string;
  artShiny: string;
  cry: string | null;
  heightM: number;
  weightKg: number;
  generation: string;
  habitat: string | null;
  color: string;
  shape: string | null;
  captureRate: number;
  femaleShare: number | null;
  eggGroups: string[];
  rarity: 'legendary' | 'mythical' | null;
  abilities: Ability[];
  stats: Stat[];
  statTotal: number;
  evolution: EvolutionStep[][];
  forms: FormVariety[];
  weakTo: Matchup[];
  resists: Matchup[];
  immuneTo: TypeName[];
}

export type FacetKey = 'type' | 'region' | 'color' | 'habitat' | 'shape';

export interface FacetOption {
  value: string;
  label: string;
}

export interface Facet {
  key: FacetKey;
  label: string;
  options: FacetOption[];
}

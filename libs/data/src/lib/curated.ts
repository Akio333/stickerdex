import { Facet, TYPE_NAMES, TypeName } from './models';

const title = (s: string) =>
  s.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase()).replace(/-/g, ' ');

/** Species in the National Dex; the daily pick draws from these without waiting for the catalog. */
export const NATIONAL_DEX_SIZE = 1025;

/** PokeAPI has no popularity metric, so this list is editorial. */
export const POPULAR_IDS = [
  25, 6, 94, 133, 150, 143, 448, 658, 778, 384, 1, 197, 149, 39, 700, 282,
];

export const LEGENDARY_IDS = [
  150, 249, 384, 483, 487, 644, 716, 791, 888, 1007,
];

export const TYPE_MASCOTS: Record<TypeName, number> = {
  normal: 143,
  fire: 6,
  water: 9,
  electric: 25,
  grass: 3,
  ice: 144,
  fighting: 448,
  poison: 89,
  ground: 95,
  flying: 16,
  psychic: 65,
  bug: 212,
  rock: 248,
  ghost: 94,
  dragon: 149,
  dark: 197,
  steel: 376,
  fairy: 700,
};

export const REGIONS = [
  { generation: 1, name: 'Kanto', starters: [1, 4, 7] },
  { generation: 2, name: 'Johto', starters: [152, 155, 158] },
  { generation: 3, name: 'Hoenn', starters: [252, 255, 258] },
  { generation: 4, name: 'Sinnoh', starters: [387, 390, 393] },
  { generation: 5, name: 'Unova', starters: [495, 498, 501] },
  { generation: 6, name: 'Kalos', starters: [650, 653, 656] },
  { generation: 7, name: 'Alola', starters: [722, 725, 728] },
  { generation: 8, name: 'Galar', starters: [810, 813, 816] },
  { generation: 9, name: 'Paldea', starters: [906, 909, 912] },
];

export const FACETS: Facet[] = [
  {
    key: 'type',
    label: 'Type',
    options: TYPE_NAMES.map((t) => ({ value: t, label: title(t) })),
  },
  {
    key: 'region',
    label: 'Region',
    options: REGIONS.map((r) => ({
      value: String(r.generation),
      label: r.name,
    })),
  },
  {
    key: 'color',
    label: 'Colour',
    options: [
      'black',
      'blue',
      'brown',
      'gray',
      'green',
      'pink',
      'purple',
      'red',
      'white',
      'yellow',
    ].map((v) => ({ value: v, label: title(v) })),
  },
  {
    key: 'habitat',
    label: 'Habitat',
    options: [
      'cave',
      'forest',
      'grassland',
      'mountain',
      'rare',
      'rough-terrain',
      'sea',
      'urban',
      'waters-edge',
    ].map((v) => ({ value: v, label: title(v) })),
  },
  {
    key: 'shape',
    label: 'Shape',
    options: [
      'ball',
      'squiggle',
      'fish',
      'arms',
      'blob',
      'upright',
      'legs',
      'quadruped',
      'wings',
      'tentacles',
      'heads',
      'humanoid',
      'bug-wings',
      'armor',
    ].map((v) => ({ value: v, label: title(v) })),
  },
];

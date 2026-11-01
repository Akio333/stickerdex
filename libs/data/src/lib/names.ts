const SPECIAL: Record<string, string> = {
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'type-null': 'Type: Null',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  flabebe: 'Flabébé',
  'tapu-koko': 'Tapu Koko',
  'tapu-lele': 'Tapu Lele',
  'tapu-bulu': 'Tapu Bulu',
  'tapu-fini': 'Tapu Fini',
  'chi-yu': 'Chi-Yu',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'wo-chien': 'Wo-Chien',
};

export function displayName(slug: string): string {
  return (
    SPECIAL[slug] ??
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export function labelFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const ART_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

export const artUrl = (id: number) => `${ART_BASE}/${id}.png`;
export const shinyArtUrl = (id: number) => `${ART_BASE}/shiny/${id}.png`;
export const dexNumber = (id: number) => `#${String(id).padStart(4, '0')}`;

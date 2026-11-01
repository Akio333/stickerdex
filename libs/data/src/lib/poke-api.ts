import { Injectable, signal } from '@angular/core';
import {
  Ability,
  EvolutionStep,
  FacetKey,
  Matchup,
  PokemonDetail,
  PokemonSummary,
  TYPE_NAMES,
  TypeName,
} from './models';
import { displayName, labelFromSlug, shinyArtUrl } from './names';
import { REGIONS } from './curated';

const API = 'https://pokeapi.co/api/v2';
const CATALOG_KEY = 'stickerdex.catalog.v1';
const FACET_KEY = 'stickerdex.facet.v1.';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

interface Named {
  name: string;
  url: string;
}
type Lang<T> = T & { language: Named };

interface ChainLink {
  species: Named;
  evolution_details: {
    trigger: Named | null;
    min_level: number | null;
    item: Named | null;
    held_item: Named | null;
    min_happiness: number | null;
    time_of_day: string;
    known_move: Named | null;
    location: Named | null;
  }[];
  evolves_to: ChainLink[];
}

const idFromUrl = (url: string) => Number(url.match(/\/(\d+)\/?$/)?.[1]);

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, value } = JSON.parse(raw) as { at: number; value: T };
    return Date.now() - at < MAX_AGE_MS ? value : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    // Storage full or blocked: the in-memory cache still applies.
  }
}

/**
 * PokeAPI client. Every response is held in memory for the session, and the catalog and
 * facet lists persist in localStorage, as the API's fair-use policy asks of consumers.
 */
@Injectable({ providedIn: 'root' })
export class PokeApi {
  private readonly requests = new Map<string, Promise<any>>();
  private catalogRequest?: Promise<PokemonSummary[]>;
  private readonly bySlug = new Map<string, PokemonSummary>();
  private readonly byId = new Map<number, PokemonSummary>();

  /** The full catalog once loaded. Synchronous reads let popups open with artwork already in place. */
  readonly catalog = signal<PokemonSummary[]>([]);

  private get<T>(path: string): Promise<T> {
    let request = this.requests.get(path);
    if (!request) {
      request = fetch(`${API}/${path}`).then((res) => {
        if (!res.ok)
          throw new Error(`PokeAPI responded ${res.status} for ${path}`);
        return res.json();
      });
      request.catch(() => this.requests.delete(path));
      this.requests.set(path, request);
    }
    return request;
  }

  loadCatalog(): Promise<PokemonSummary[]> {
    return (this.catalogRequest ??= this.fetchCatalog().catch((err) => {
      this.catalogRequest = undefined;
      throw err;
    }));
  }

  private async fetchCatalog(): Promise<PokemonSummary[]> {
    let rows = readCache<[number, string, ...TypeName[]][]>(CATALOG_KEY);
    if (!rows) {
      const species = await this.get<{ results: Named[] }>(
        'pokemon-species?limit=2000',
      );
      const types = await Promise.all(
        TYPE_NAMES.map((t) =>
          this.get<{ pokemon: { slot: number; pokemon: Named }[] }>(
            `type/${t}`,
          ),
        ),
      );
      const typesById = new Map<number, TypeName[]>();
      types.forEach((type, i) =>
        type.pokemon.forEach(({ slot, pokemon }) => {
          const id = idFromUrl(pokemon.url);
          const list = typesById.get(id) ?? [];
          list[slot - 1] = TYPE_NAMES[i];
          typesById.set(id, list);
        }),
      );
      rows = species.results.map((s) => {
        const id = idFromUrl(s.url);
        return [
          id,
          s.name,
          ...(typesById.get(id) ?? ['normal' as TypeName]).filter(Boolean),
        ];
      });
      writeCache(CATALOG_KEY, rows);
    }
    const catalog = rows.map(([id, slug, ...types]): PokemonSummary => ({
      id,
      slug,
      name: displayName(slug),
      types,
    }));
    for (const item of catalog) {
      this.bySlug.set(item.slug, item);
      this.byId.set(item.id, item);
    }
    this.catalog.set(catalog);
    return catalog;
  }

  summaryBySlug(slug: string): PokemonSummary | undefined {
    return this.bySlug.get(slug);
  }

  summaryById(id: number): PokemonSummary | undefined {
    return this.byId.get(id);
  }

  /** Species ids belonging to a filter value. Type comes from the catalog; the others cost one cached request. */
  async facetMembers(key: FacetKey, value: string): Promise<Set<number>> {
    if (key === 'type') {
      const catalog = await this.loadCatalog();
      return new Set(
        catalog
          .filter((p) => p.types.includes(value as TypeName))
          .map((p) => p.id),
      );
    }
    const cacheKey = `${FACET_KEY}${key}.${value}`;
    let ids = readCache<number[]>(cacheKey);
    if (!ids) {
      const path = {
        region: 'generation',
        color: 'pokemon-color',
        habitat: 'pokemon-habitat',
        shape: 'pokemon-shape',
      }[key];
      const res = await this.get<{ pokemon_species: Named[] }>(
        `${path}/${value}`,
      );
      ids = res.pokemon_species.map((s) => idFromUrl(s.url));
      writeCache(cacheKey, ids);
    }
    return new Set(ids);
  }

  /** Accepts a species slug or a numeric id, the two forms a /pokemon/ URL may carry. */
  async detail(slugOrId: string): Promise<PokemonDetail> {
    const species = await this.get<any>(`pokemon-species/${slugOrId}`);
    const [pokemon, chain] = await Promise.all([
      this.get<any>(`pokemon/${species.id}`),
      this.get<{ chain: ChainLink }>(
        species.evolution_chain.url.replace(`${API}/`, ''),
      ),
    ]);
    const types: TypeName[] = pokemon.types.map(
      (t: { type: Named }) => t.type.name,
    );
    const [abilities, matchups] = await Promise.all([
      this.abilities(pokemon.abilities),
      this.matchups(types),
    ]);

    const english = <T>(list: Lang<T>[]) =>
      list.find((e) => e.language.name === 'en');
    const flavor = [...species.flavor_text_entries]
      .reverse()
      .find((e: Lang<{ flavor_text: string }>) => e.language.name === 'en');
    const stats = pokemon.stats.map(
      (s: { base_stat: number; stat: Named }) => ({
        key: s.stat.name,
        label: STAT_LABELS[s.stat.name] ?? labelFromSlug(s.stat.name),
        value: s.base_stat,
      }),
    );

    return {
      id: species.id,
      slug: species.name,
      name:
        english<{ name: string }>(species.names)?.name ??
        displayName(species.name),
      nameJa:
        species.names.find(
          (n: Lang<{ name: string }>) => n.language.name === 'ja-hrkt',
        )?.name ?? '',
      genus: english<{ genus: string }>(species.genera)?.genus ?? '',
      flavor: flavor
        ? flavor.flavor_text
            .replace(/[\f\n\r­]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '',
      types,
      artShiny: shinyArtUrl(species.id),
      cry: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
      heightM: pokemon.height / 10,
      weightKg: pokemon.weight / 10,
      generation:
        REGIONS.find((r) => r.generation === idFromUrl(species.generation.url))
          ?.name ?? labelFromSlug(species.generation.name),
      habitat: species.habitat ? labelFromSlug(species.habitat.name) : null,
      color: labelFromSlug(species.color.name),
      shape: species.shape ? labelFromSlug(species.shape.name) : null,
      captureRate: species.capture_rate,
      femaleShare: species.gender_rate < 0 ? null : species.gender_rate / 8,
      eggGroups: species.egg_groups.map((g: Named) => labelFromSlug(g.name)),
      rarity: species.is_legendary
        ? 'legendary'
        : species.is_mythical
          ? 'mythical'
          : null,
      abilities,
      stats,
      statTotal: stats.reduce(
        (sum: number, s: { value: number }) => sum + s.value,
        0,
      ),
      evolution: this.evolutionStages(chain.chain),
      forms: species.varieties
        .filter((v: { is_default: boolean }) => !v.is_default)
        .map((v: { pokemon: Named }) => ({
          id: idFromUrl(v.pokemon.url),
          name: labelFromSlug(v.pokemon.name.replace(`${species.name}-`, '')),
        })),
      ...matchups,
    };
  }

  private abilities(
    list: { is_hidden: boolean; ability: Named }[],
  ): Promise<Ability[]> {
    return Promise.all(
      list.map(async ({ ability, is_hidden }) => {
        const full = await this.get<any>(`ability/${ability.name}`);
        const en = (l: Lang<any>[]) => l.find((e) => e.language.name === 'en');
        return {
          name: en(full.names)?.name ?? labelFromSlug(ability.name),
          hidden: is_hidden,
          effect:
            en(full.effect_entries)?.short_effect ??
            en(full.flavor_text_entries)?.flavor_text ??
            '',
        };
      }),
    );
  }

  private async matchups(types: TypeName[]) {
    const relations = await Promise.all(
      types.map((t) => this.get<any>(`type/${t}`)),
    );
    const multipliers = new Map<TypeName, number>(
      TYPE_NAMES.map((t) => [t, 1]),
    );
    const apply = (list: Named[], factor: number) =>
      list.forEach((t) =>
        multipliers.set(
          t.name as TypeName,
          (multipliers.get(t.name as TypeName) ?? 1) * factor,
        ),
      );
    for (const { damage_relations: d } of relations) {
      apply(d.double_damage_from, 2);
      apply(d.half_damage_from, 0.5);
      apply(d.no_damage_from, 0);
    }
    const entries = [...multipliers].map(([type, multiplier]): Matchup => ({
      type,
      multiplier,
    }));
    return {
      weakTo: entries
        .filter((e) => e.multiplier > 1)
        .sort((a, b) => b.multiplier - a.multiplier),
      resists: entries
        .filter((e) => e.multiplier > 0 && e.multiplier < 1)
        .sort((a, b) => a.multiplier - b.multiplier),
      immuneTo: entries.filter((e) => e.multiplier === 0).map((e) => e.type),
    };
  }

  private evolutionStages(root: ChainLink): EvolutionStep[][] {
    const stages: EvolutionStep[][] = [];
    const walk = (link: ChainLink, depth: number) => {
      const id = idFromUrl(link.species.url);
      (stages[depth] ??= []).push({
        id,
        slug: link.species.name,
        name: displayName(link.species.name),
        how: this.evolutionHow(link),
      });
      link.evolves_to.forEach((next) => walk(next, depth + 1));
    };
    walk(root, 0);
    return stages;
  }

  private evolutionHow(link: ChainLink): string {
    const d = link.evolution_details.at(-1);
    if (!d) return '';
    if (d.min_level) return `Level ${d.min_level}`;
    if (d.item) return labelFromSlug(d.item.name);
    if (d.held_item)
      return `Holding ${labelFromSlug(d.held_item.name).toLowerCase()}`;
    if (d.min_happiness)
      return d.time_of_day ? `Friendship, ${d.time_of_day}` : 'Friendship';
    if (d.known_move)
      return `Knows ${labelFromSlug(d.known_move.name).toLowerCase()}`;
    if (d.location) return `At ${labelFromSlug(d.location.name).toLowerCase()}`;
    if (d.trigger?.name === 'trade') return 'Trade';
    return d.trigger ? labelFromSlug(d.trigger.name) : '';
  }
}

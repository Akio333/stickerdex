import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FACETS,
  Facet,
  FacetKey,
  PokeApi,
  PokemonSummary,
} from '@stickerdex/data';
import { Seal } from '@stickerdex/ui';

const PAGE_SIZE = 48;
const FACET_KEYS: FacetKey[] = ['type', 'region', 'color', 'habitat', 'shape'];

@Component({
  selector: 'sd-search-page',
  imports: [Seal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})
export class SearchPage {
  private readonly api = inject(PokeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  // Bound from the query string, so every search is a shareable URL.
  readonly q = input<string>();
  readonly type = input<string>();
  readonly region = input<string>();
  readonly color = input<string>();
  readonly habitat = input<string>();
  readonly shape = input<string>();

  protected readonly facets = FACETS;
  protected readonly term = linkedSignal(() => this.q() ?? '');
  protected readonly openFacet = signal<FacetKey | null>(null);
  private readonly limit = signal(PAGE_SIZE);
  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly selected = computed(() => {
    const values: Partial<Record<FacetKey, string>> = {
      type: this.type(),
      region: this.region(),
      color: this.color(),
      habitat: this.habitat(),
      shape: this.shape(),
    };
    return FACET_KEYS.filter((k) => values[k]).map((key) => ({
      key,
      value: values[key] as string,
    }));
  });

  protected readonly hasFilters = computed(
    () => this.selected().length > 0 || this.term().trim() !== '',
  );
  protected readonly flood = computed(() =>
    this.type() ? `flood-${this.type()}` : '',
  );

  private readonly catalog = resource({ loader: () => this.api.loadCatalog() });

  private readonly memberSets = resource({
    params: () => this.selected(),
    loader: ({ params }) =>
      Promise.all(
        params.map(({ key, value }) => this.api.facetMembers(key, value)),
      ),
  });

  protected readonly loading = computed(
    () => this.catalog.isLoading() || this.memberSets.isLoading(),
  );
  protected readonly failed = computed(
    () => !!this.catalog.error() || !!this.memberSets.error(),
  );

  /**
   * Null until the first filter resolves. A resource has no value while it reloads, so the previous
   * results stay on screen until the new filter's members arrive.
   */
  protected readonly results = linkedSignal<
    PokemonSummary[] | null,
    PokemonSummary[] | null
  >({
    source: () => {
      const catalog = this.catalog.hasValue() ? this.catalog.value() : null;
      const sets = this.memberSets.hasValue() ? this.memberSets.value() : null;
      return catalog && sets ? this.match(catalog, sets, this.term()) : null;
    },
    computation: (next, previous) => next ?? previous?.value ?? null,
  });

  protected readonly visible = computed(() =>
    this.failed() ? [] : (this.results() ?? []).slice(0, this.limit()),
  );

  constructor() {
    effect(() => {
      this.results();
      this.limit.set(PAGE_SIZE);
    });
    effect((onCleanup) => {
      const target = this.sentinel()?.nativeElement;
      if (!target) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting)
            this.limit.update((n) =>
              Math.min(n + PAGE_SIZE, this.results()?.length ?? 0),
            );
        },
        { rootMargin: '600px' },
      );
      observer.observe(target);
      onCleanup(() => observer.disconnect());
    });
    effect(() => {
      // Show the panel for an active filter when arriving from a shared link.
      const first = this.selected()[0];
      if (first && this.openFacet() === null) this.openFacet.set(first.key);
    });
  }

  private match(
    catalog: PokemonSummary[],
    sets: Set<number>[],
    rawTerm: string,
  ): PokemonSummary[] {
    const term = rawTerm.trim().toLowerCase().replace(/^#0*/, '');
    const matches = catalog.filter(
      (p) =>
        sets.every((set) => set.has(p.id)) &&
        (!term ||
          p.slug.includes(term) ||
          p.name.toLowerCase().includes(term) ||
          String(p.id) === term),
    );
    if (!term) return matches;
    const starts = (p: PokemonSummary) =>
      p.name.toLowerCase().startsWith(term) ? 0 : 1;
    return [...matches].sort((a, b) => starts(a) - starts(b) || a.id - b.id);
  }

  protected valueOf(key: FacetKey): string | undefined {
    return this.selected().find((s) => s.key === key)?.value;
  }

  protected labelOf(facet: Facet): string | undefined {
    const value = this.valueOf(facet.key);
    return facet.options.find((o) => o.value === value)?.label;
  }

  protected toggleFacet(key: FacetKey): void {
    this.openFacet.update((current) => (current === key ? null : key));
  }

  protected choose(key: FacetKey, value: string): void {
    this.updateQuery({ [key]: this.valueOf(key) === value ? null : value });
  }

  protected onTerm(value: string): void {
    this.term.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(
      () => this.updateQuery({ q: value.trim() || null }),
      180,
    );
  }

  protected clear(): void {
    clearTimeout(this.searchTimer);
    this.term.set('');
    this.openFacet.set(null);
    this.updateQuery(
      Object.fromEntries(['q', ...FACET_KEYS].map((k) => [k, null])),
    );
  }

  protected retry(): void {
    this.catalog.reload();
    this.memberSets.reload();
  }

  private updateQuery(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

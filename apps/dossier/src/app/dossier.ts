import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PokeApi, StickerOverlay, artUrl, dexNumber } from '@stickerdex/data';
import { TypeTag } from '@stickerdex/ui';

@Component({
  selector: 'sd-dossier',
  imports: [RouterLink, TypeTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dossier.html',
  styleUrl: './dossier.css',
})
export class Dossier {
  readonly slug = input.required<string>();
  readonly mode = input.required<'page' | 'overlay'>();

  private readonly api = inject(PokeApi);
  private readonly overlay = inject(StickerOverlay);
  private readonly title = inject(Title);

  protected readonly detail = resource({
    params: () => this.slug(),
    loader: ({ params }) => this.api.detail(params),
  });

  /** Known instantly from the catalog, so the popup can open with art and colour before details arrive. */
  private readonly summary = computed(() => {
    this.api.catalog();
    return this.api.summaryBySlug(this.slug());
  });

  protected readonly id = computed(() => this.current()?.id ?? null);
  protected readonly name = computed(() => this.current()?.name ?? '');
  protected readonly number = computed(() =>
    this.id() ? dexNumber(this.id() as number) : '',
  );
  protected readonly flood = computed(() => {
    const type = this.current()?.types[0];
    return type ? `flood-${type}` : '';
  });
  protected readonly types = computed(() => this.current()?.types ?? []);

  protected readonly shiny = signal(false);
  protected readonly flipping = signal(false);
  protected readonly crying = signal(false);
  protected readonly cryFailed = signal(false);

  protected readonly art = computed(() => {
    const id = this.id();
    if (!id) return '';
    return this.shiny() && this.detail.hasValue()
      ? this.detail.value().artShiny
      : artUrl(id);
  });

  private current() {
    const loaded = this.detail.hasValue() ? this.detail.value() : undefined;
    return loaded?.slug === this.slug() || loaded?.id === Number(this.slug())
      ? loaded
      : this.summary();
  }

  protected readonly femaleLabel = computed(() => {
    const share = this.detail.hasValue()
      ? this.detail.value().femaleShare
      : null;
    if (share === null) return 'Genderless';
    return `${Math.round(share * 100)}% female`;
  });

  constructor() {
    this.api.loadCatalog().catch(() => undefined);
    effect(() => {
      this.slug();
      this.shiny.set(false);
      this.cryFailed.set(false);
    });
    effect(() => {
      const name = this.name();
      if (name) this.title.setTitle(name);
    });
  }

  protected toggleShiny(): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.shiny.update((v) => !v);
      return;
    }
    this.flipping.set(true);
    setTimeout(() => this.shiny.update((v) => !v), 170);
    setTimeout(() => this.flipping.set(false), 360);
  }

  protected playCry(url: string): void {
    this.crying.set(true);
    setTimeout(() => this.crying.set(false), 600);
    new Audio(url).play().catch(() => {
      this.crying.set(false);
      this.cryFailed.set(true);
    });
  }

  protected openEvolution(event: MouseEvent, slug: string): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    this.overlay.open(slug);
  }

  protected artFor(id: number): string {
    return artUrl(id);
  }

  protected barWidth(value: number): string {
    return `${Math.min(value / 255, 1)}`;
  }
}

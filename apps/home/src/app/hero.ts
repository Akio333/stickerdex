import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import {
  NATIONAL_DEX_SIZE,
  PokeApi,
  artUrl,
  dexNumber,
  pokemonOfTheDay,
} from '@stickerdex/data';
import { StickerLink, Tilt, TypeTag } from '@stickerdex/ui';

@Component({
  selector: 'sd-hero',
  imports: [StickerLink, Tilt, TypeTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  private readonly api = inject(PokeApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly today = new Date();
  private readonly id = pokemonOfTheDay(this.today, NATIONAL_DEX_SIZE);

  protected readonly dateLabel = this.today.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  protected readonly isoDate = this.today.toLocaleDateString('en-CA');
  protected readonly art = artUrl(this.id);
  protected readonly number = dexNumber(this.id);

  protected readonly pokemon = resource({
    loader: () => this.api.detail(String(this.id)),
  });
  protected readonly flood = computed(() => {
    const p = this.pokemon.value();
    return p ? `flood-${p.types[0]}` : '';
  });
  protected readonly kana = computed(() => [
    ...(this.pokemon.value()?.nameJa ?? ''),
  ]);
  protected readonly crying = signal(false);

  protected scrollToNext(): void {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.host.nativeElement.nextElementSibling?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  protected playCry(url: string): void {
    this.crying.set(true);
    setTimeout(() => this.crying.set(false), 600);
    new Audio(url).play().catch(() => this.crying.set(false));
  }
}

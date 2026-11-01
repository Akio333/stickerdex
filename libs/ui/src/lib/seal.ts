import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  PokemonSummary,
  StickerOverlay,
  artUrl,
  dexNumber,
} from '@stickerdex/data';
import { StickerLink } from './sticker-link';
import { Tilt } from './tilt';

@Component({
  selector: 'sd-seal',
  imports: [StickerLink, Tilt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="seal"
      [sdStickerLink]="pokemon().slug"
      [sdTilt]="foil() ? 14 : 0"
      [class.ghost]="ghost()"
      [class.is-foil]="foil()"
      [style.--spin]="spin()"
      [style.--a]="colorA()"
      [style.--b]="colorB()"
      draggable="false"
    >
      @if (!foil()) {
        <span class="disc"></span>
      }
      <span class="sticker">
        <img
          class="sd-art diecut"
          [src]="art()"
          alt=""
          width="475"
          height="475"
          loading="lazy"
          draggable="false"
        />
        @if (foil()) {
          <span class="foil" [style.--art]="'url(' + art() + ')'"></span>
        }
      </span>
      <span class="label">
        <strong>{{ pokemon().name }}</strong>
        <small>{{ number() }} {{ typeText() }}</small>
      </span>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .seal {
      position: relative;
      display: grid;
      justify-items: center;
      text-decoration: none;
      -webkit-user-drag: none;
    }
    .disc {
      grid-area: 1 / 1;
      width: 82%;
      aspect-ratio: 1;
      margin-top: 9%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--a) 50%, var(--b) 50%);
    }
    .sticker {
      grid-area: 1 / 1;
      position: relative;
      isolation: isolate;
      width: 100%;
      aspect-ratio: 1;
      transform: perspective(700px) rotateX(var(--rx, 0deg))
        rotateY(var(--ry, 0deg)) rotate(var(--spin));
      transition: transform 0.28s var(--spring);
    }
    .sd-art {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .label {
      display: grid;
      justify-items: center;
      margin-top: 0.4rem;
      text-align: center;
      line-height: 1.25;
    }
    strong {
      font: 400 1.0625rem/1.2 var(--display);
    }
    small {
      font-size: 0.8125rem;
      font-weight: 700;
    }
    .is-foil .sticker {
      --cut: 4px;
    }
    .is-foil .label {
      color: var(--seal);
    }
    .is-foil:hover .foil,
    .is-foil:focus-visible .foil {
      opacity: 0.7;
    }

    @media (hover: hover) {
      .seal:not(.is-foil):hover .sticker {
        transform: scale(1.1) rotate(calc(var(--spin) * -0.6)) translateY(-4%);
      }
    }
    .seal:active .sticker {
      transform: scale(0.96) rotate(var(--spin));
      transition-duration: 0.1s;
    }

    /* The peel leaves its silhouette behind on the sheet while the sticker is in the popup. */
    .ghost .sd-art {
      filter: brightness(0) opacity(var(--ghost));
    }
  `,
})
export class Seal {
  readonly pokemon = input.required<PokemonSummary>();
  readonly foil = input(false);

  private readonly overlay = inject(StickerOverlay);

  protected readonly ghost = computed(
    () => this.overlay.activeSlug() === this.pokemon().slug,
  );
  protected readonly art = computed(() => artUrl(this.pokemon().id));
  protected readonly number = computed(() => dexNumber(this.pokemon().id));
  protected readonly spin = computed(
    () => `${((this.pokemon().id * 37) % 9) - 4}deg`,
  );
  protected readonly colorA = computed(
    () => `var(--t-${this.pokemon().types[0]})`,
  );
  protected readonly colorB = computed(
    () => `var(--t-${this.pokemon().types[1] ?? this.pokemon().types[0]})`,
  );
  protected readonly typeText = computed(() =>
    this.pokemon()
      .types.map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(', '),
  );
}

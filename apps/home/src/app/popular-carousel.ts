import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { POPULAR_IDS, PokeApi } from '@stickerdex/data';
import { Seal } from '@stickerdex/ui';

@Component({
  selector: 'sd-popular-carousel',
  imports: [Seal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="popular-title">
      <header>
        <h2 id="popular-title">Popular</h2>
        <div class="arrows">
          <button
            type="button"
            aria-label="Previous"
            [disabled]="atStart()"
            (click)="step(-1)"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            aria-label="Next"
            [disabled]="atEnd()"
            (click)="step(1)"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </header>
      <ul
        #strip
        class="strip"
        [class.dragging]="dragging()"
        (scroll)="updateEnds()"
        (pointerdown)="dragStart($event)"
        (pointermove)="dragMove($event)"
        (pointerup)="dragEnd()"
        (pointercancel)="dragEnd()"
      >
        @for (p of popular(); track p.id) {
          <li><sd-seal [pokemon]="p" /></li>
        } @empty {
          @for (n of placeholders; track n) {
            <li class="placeholder"><span></span></li>
          }
        }
      </ul>
    </section>
  `,
  styles: `
    section {
      padding: 5rem 0 3rem;
      overflow: hidden;
    }
    header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      padding: 0 calc(var(--tabs-width) + 1.5rem) 0 1.5rem;
    }
    h2 {
      font: 400 clamp(3rem, 9vw, 7rem)/1 var(--display);
    }
    .arrows {
      display: flex;
      gap: 0.5rem;
    }
    .arrows button {
      width: 3.25rem;
      height: 3.25rem;
      border: 3px solid var(--ink);
      border-radius: 50%;
      background: var(--ink);
      color: var(--on-ink);
      font: 900 1.75rem/1 var(--body);
      transition:
        transform 0.2s var(--spring),
        opacity 0.2s;
    }
    .arrows button:hover:not(:disabled) {
      transform: scale(1.1);
    }
    .arrows button:active:not(:disabled) {
      transform: scale(0.92);
    }
    .arrows button:disabled {
      background: transparent;
      color: var(--ink);
      opacity: 0.35;
      cursor: default;
    }

    .strip {
      display: flex;
      gap: clamp(0.25rem, 1.5vw, 1.5rem);
      padding: 1.5rem max(1.5rem, calc(50vw - 11rem));
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      cursor: grab;
      touch-action: pan-x pan-y;
    }
    .strip::-webkit-scrollbar {
      display: none;
    }
    .strip.dragging {
      scroll-snap-type: none;
      cursor: grabbing;
      user-select: none;
    }
    li {
      flex: 0 0 clamp(13rem, 24vw, 22rem);
      scroll-snap-align: center;
    }
    .placeholder span {
      display: block;
      width: 82%;
      aspect-ratio: 1;
      margin: 9% auto;
      border-radius: 50%;
      background: color-mix(in srgb, var(--ink) 8%, transparent);
    }

    /* The sticker at the centre of the strip is the largest; ones at the edges lean away. */
    @supports (animation-timeline: view()) {
      li {
        animation: lens linear both;
        animation-timeline: view(inline);
      }
      @keyframes lens {
        0% {
          transform: scale(0.68) rotate(-9deg) translateY(10%);
        }
        50% {
          transform: scale(1.04) rotate(0deg) translateY(0);
        }
        100% {
          transform: scale(0.68) rotate(9deg) translateY(10%);
        }
      }
    }
    @media (prefers-reduced-motion: reduce) {
      li {
        animation: none;
      }
    }
    @media (max-width: 760px) {
      section {
        padding-top: 3.5rem;
      }
      header {
        padding: 0 1.25rem;
      }
      .arrows {
        display: none;
      }
    }
  `,
})
export class PopularCarousel {
  private readonly api = inject(PokeApi);
  private readonly injector = inject(Injector);
  private readonly strip = viewChild.required<ElementRef<HTMLElement>>('strip');

  private dragOrigin: { x: number; scroll: number; pointer: number } | null =
    null;
  private moved = false;

  protected readonly placeholders = [1, 2, 3, 4, 5, 6];
  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(false);
  protected readonly dragging = signal(false);
  protected readonly popular = computed(() => {
    if (!this.api.catalog().length) return [];
    return POPULAR_IDS.map((id) => this.api.summaryById(id)).filter(
      (p) => p !== undefined,
    );
  });

  constructor() {
    // Start with a sticker from the middle of the list centred, so the strip is full on both sides.
    effect(() => {
      if (!this.popular().length) return;
      afterNextRender(
        () => {
          const el = this.strip().nativeElement;
          const item = el.querySelectorAll('li')[2];
          el.scrollLeft =
            item.offsetLeft + item.offsetWidth / 2 - el.clientWidth / 2;
          this.updateEnds();
        },
        { injector: this.injector },
      );
    });
    // Capture phase, so it runs before the click reaches the sticker's link.
    afterNextRender(() =>
      this.strip().nativeElement.addEventListener(
        'click',
        (e) => this.swallowDragClick(e),
        { capture: true },
      ),
    );
  }

  protected step(direction: 1 | -1): void {
    const el = this.strip().nativeElement;
    const item = el.querySelector('li');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: direction * (item ? item.offsetWidth * 2 : 400),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  protected updateEnds(): void {
    const el = this.strip().nativeElement;
    this.atStart.set(el.scrollLeft < 8);
    this.atEnd.set(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
  }

  protected dragStart(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    this.dragOrigin = {
      x: event.clientX,
      scroll: this.strip().nativeElement.scrollLeft,
      pointer: event.pointerId,
    };
    this.moved = false;
  }

  protected dragMove(event: PointerEvent): void {
    if (!this.dragOrigin) return;
    const distance = event.clientX - this.dragOrigin.x;
    if (!this.moved && Math.abs(distance) < 6) return;
    if (!this.moved) {
      this.moved = true;
      this.dragging.set(true);
      this.strip().nativeElement.setPointerCapture(this.dragOrigin.pointer);
    }
    this.strip().nativeElement.scrollLeft = this.dragOrigin.scroll - distance;
  }

  protected dragEnd(): void {
    this.dragOrigin = null;
    this.dragging.set(false);
  }

  /** A drag that ends over a sticker must not count as clicking it. */
  private swallowDragClick(event: MouseEvent): void {
    if (!this.moved) return;
    event.preventDefault();
    event.stopPropagation();
    this.moved = false;
  }
}

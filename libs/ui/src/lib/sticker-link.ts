import { Directive, ElementRef, computed, inject, input } from '@angular/core';
import { StickerOverlay } from '@stickerdex/data';

/**
 * A real link to /pokemon/:slug. A plain click opens the popup; cmd/ctrl/shift/middle click and
 * "open in new tab" fall through to the browser and land on the full page.
 */
@Directive({
  selector: 'a[sdStickerLink]',
  host: { '[attr.href]': 'href()', '(click)': 'open($event)' },
})
export class StickerLink {
  readonly slug = input.required<string>({ alias: 'sdStickerLink' });

  private readonly overlay = inject(StickerOverlay);
  private readonly host = inject<ElementRef<HTMLAnchorElement>>(ElementRef);

  protected readonly href = computed(() => `/pokemon/${this.slug()}`);

  protected open(event: MouseEvent): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (!this.overlay.available) return;
    event.preventDefault();
    const art =
      this.host.nativeElement.querySelector<HTMLElement>('.sd-art') ??
      document.querySelector<HTMLElement>(`[data-art-for="${this.slug()}"]`);
    const rect = (art ?? this.host.nativeElement).getBoundingClientRect();
    this.overlay.open(this.slug(), {
      art,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }
}

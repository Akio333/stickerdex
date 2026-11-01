import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input } from '@angular/core';

/** Writes pointer position to CSS variables: --rx/--ry for 3D tilt, --mx/--my (0 to 100) for foil. */
@Directive({
  selector: '[sdTilt]',
  host: { '(pointermove)': 'move($event)', '(pointerleave)': 'reset()' },
})
export class Tilt {
  readonly strength = input(10, { alias: 'sdTilt' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly reducedMotion = inject(DOCUMENT).defaultView?.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );

  protected move(event: PointerEvent): void {
    if (event.pointerType === 'touch' || this.reducedMotion?.matches) return;
    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const strength = this.strength();
    el.style.setProperty('--ry', `${(x - 0.5) * strength * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * strength * 2}deg`);
    el.style.setProperty('--mx', String(Math.round(x * 100)));
    el.style.setProperty('--my', String(Math.round(y * 100)));
  }

  protected reset(): void {
    const style = this.host.nativeElement.style;
    for (const name of ['--rx', '--ry', '--mx', '--my'])
      style.removeProperty(name);
  }
}

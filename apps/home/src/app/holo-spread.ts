import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { LEGENDARY_IDS, PokeApi } from '@stickerdex/data';
import { Seal } from '@stickerdex/ui';

@Component({
  selector: 'sd-holo-spread',
  imports: [Seal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="legendary-title">
      <h2 id="legendary-title">Legendaries</h2>
      <ul>
        @for (p of legendaries(); track p.id) {
          <li><sd-seal [pokemon]="p" [foil]="true" /></li>
        }
      </ul>
    </section>
  `,
  styles: `
    section {
      padding: 4.5rem calc(var(--tabs-width) + 1.5rem) 4rem 1.5rem;
      background: var(--spread);
      color: var(--seal);
    }
    h2 {
      font: 400 clamp(3rem, 9vw, 7rem)/1 var(--display);
    }

    /* An uneven collage, like a page of an album filled by hand. */
    ul {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 0.5rem 1rem;
      margin-top: 2rem;
    }
    li {
      grid-column: span 3;
    }
    li:nth-child(1) {
      grid-column: span 5;
    }
    li:nth-child(2) {
      grid-column: span 4;
      margin-top: 12%;
    }
    li:nth-child(3) {
      grid-column: span 3;
      margin-top: 30%;
    }
    li:nth-child(4) {
      grid-column: span 3;
    }
    li:nth-child(5) {
      grid-column: span 4;
      margin-top: -8%;
    }
    li:nth-child(6) {
      grid-column: span 5;
    }
    li:nth-child(7),
    li:nth-child(8) {
      grid-column: span 3;
    }
    li:nth-child(8) {
      margin-top: 10%;
    }
    li:nth-child(9) {
      grid-column: span 3;
    }
    li:nth-child(10) {
      grid-column: span 3;
      margin-top: 10%;
    }

    @media (max-width: 760px) {
      section {
        padding: 3rem 1.25rem;
      }
      ul {
        grid-template-columns: repeat(2, 1fr);
      }
      li:nth-child(n) {
        grid-column: auto;
        margin-top: 0;
      }
      li:nth-child(5n + 1) {
        grid-column: 1 / -1;
        padding: 0 12%;
      }
    }
  `,
})
export class HoloSpread {
  private readonly api = inject(PokeApi);

  protected readonly legendaries = computed(() => {
    if (!this.api.catalog().length) return [];
    return LEGENDARY_IDS.map((id) => this.api.summaryById(id)).filter(
      (p) => p !== undefined,
    );
  });
}

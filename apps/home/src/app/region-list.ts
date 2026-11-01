import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REGIONS, artUrl } from '@stickerdex/data';

@Component({
  selector: 'sd-region-list',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="regions-title">
      <h2 id="regions-title">Regions</h2>
      <ol>
        @for (region of regions; track region.generation) {
          <li>
            <a
              routerLink="/search"
              [queryParams]="{ region: region.generation }"
            >
              <span class="trio">
                @for (art of region.art; track art; let i = $index) {
                  <img
                    class="diecut"
                    [src]="art"
                    alt=""
                    width="475"
                    height="475"
                    loading="lazy"
                    draggable="false"
                    [style.--i]="i - 1"
                  />
                }
              </span>
              <strong>{{ region.name }}</strong>
              <small>Generation {{ region.generation }}</small>
            </a>
          </li>
        }
      </ol>
    </section>
  `,
  styles: `
    section {
      padding: 5rem calc(var(--tabs-width) + 1.5rem) 3rem 1.5rem;
    }
    h2 {
      font: 400 clamp(3rem, 9vw, 7rem)/1 var(--display);
    }
    ol {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
      gap: 2.5rem 1.5rem;
      margin-top: 2.5rem;
    }
    a {
      display: block;
      text-decoration: none;
    }
    strong {
      display: block;
      margin-top: 0.75rem;
      font: 400 1.75rem/1.1 var(--display);
    }
    small {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .trio {
      position: relative;
      display: block;
      height: 9.5rem;
    }
    img {
      --cut: 2px;
      position: absolute;
      bottom: 0;
      left: 30%;
      width: 8rem;
      transform: translateX(calc(var(--i) * 28%)) rotate(calc(var(--i) * 6deg));
      transition: transform 0.35s var(--spring);
    }
    a:hover img,
    a:focus-visible img {
      transform: translateX(calc(var(--i) * 72%))
        translateY(calc(var(--i) * var(--i) * 8%))
        rotate(calc(var(--i) * 12deg));
    }
    @media (max-width: 760px) {
      section {
        padding: 3rem 1.25rem 2rem;
      }
    }
  `,
})
export class RegionList {
  protected readonly regions = REGIONS.map((r) => ({
    ...r,
    art: r.starters.map(artUrl),
  }));
}

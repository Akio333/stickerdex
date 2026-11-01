import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TYPE_MASCOTS, TYPE_NAMES, artUrl } from '@stickerdex/data';

@Component({
  selector: 'sd-type-strip',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="types-title">
      <h2 id="types-title">Browse by type</h2>
      <ul>
        @for (t of types; track t.name) {
          <li [class]="'flood-' + t.name">
            <a routerLink="/search" [queryParams]="{ type: t.name }">
              <span class="word">{{ t.name }}</span>
              <img
                class="diecut"
                [src]="t.art"
                alt=""
                width="475"
                height="475"
                loading="lazy"
                draggable="false"
              />
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    section {
      padding: 2rem 0 5rem;
    }
    h2 {
      padding: 0 calc(var(--tabs-width) + 1.5rem) 1.5rem 1.5rem;
      font: 400 clamp(2rem, 5vw, 4rem)/1.05 var(--display);
    }
    ul {
      display: flex;
      height: clamp(20rem, 58svh, 34rem);
    }
    li {
      flex: 1 1 0;
      min-width: 0;
      transition: flex-grow 0.45s var(--glide);
    }
    li:hover,
    li:focus-within {
      flex-grow: 6;
    }
    a {
      position: relative;
      display: block;
      height: 100%;
      overflow: hidden;
      background: var(--flood);
      color: var(--on);
      text-decoration: none;
    }
    a:focus-visible {
      outline-offset: -6px;
      box-shadow: none;
      border-radius: 0;
    }
    .word {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      font: 400 clamp(1rem, 1.7vw, 1.5rem)/1 var(--display);
      text-transform: capitalize;
      white-space: nowrap;
      writing-mode: vertical-rl;
      transform: translateX(-50%) rotate(180deg);
    }
    img {
      --cut: 4px;
      position: absolute;
      top: 50%;
      left: 50%;
      width: min(26rem, 24vw);
      max-width: none;
      opacity: 0;
      transform: translate(-50%, -30%) rotate(14deg) scale(0.6);
      transition:
        transform 0.5s var(--spring),
        opacity 0.2s;
      pointer-events: none;
    }
    li:hover img,
    li:focus-within img {
      opacity: 1;
      transform: translate(-50%, -55%) rotate(-3deg) scale(1);
    }
    li:hover .word,
    li:focus-within .word {
      font-size: clamp(1.5rem, 2.5vw, 2.25rem);
    }

    @media (max-width: 760px) {
      section {
        padding: 1rem 0 3rem;
      }
      h2 {
        padding: 0 1.25rem 1rem;
      }
      ul {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        height: auto;
      }
      a {
        aspect-ratio: 1;
      }
      .word {
        bottom: 0.6rem;
        left: 0.6rem;
        writing-mode: horizontal-tb;
        transform: none;
      }
      img,
      li:hover img,
      li:focus-within img {
        top: 0.25rem;
        left: auto;
        right: 0.25rem;
        width: 72%;
        opacity: 1;
        transform: rotate(-4deg);
      }
      li:hover .word,
      li:focus-within .word {
        font-size: inherit;
      }
    }
  `,
})
export class TypeStrip {
  protected readonly types = TYPE_NAMES.map((name) => ({
    name,
    art: artUrl(TYPE_MASCOTS[name]),
  }));
}

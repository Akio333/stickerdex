import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { PokeApi, StickerOverlay } from '@stickerdex/data';
import { loadDossierOverlay } from './app.routes';
import { Theme } from './theme';

@Component({
  selector: 'sd-root',
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly theme = inject(Theme);
  private readonly router = inject(Router);
  private readonly overlay = inject(StickerOverlay);

  private readonly scrollByPage = new Map<number, number>();
  private pageId = 0;
  private lastBackground = '';

  /** The tab is decided by the page underneath, so it stays lit while a popup is open. */
  protected readonly section = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.overlay.backgroundUrl().split(/[?#]/)[0]),
    ),
    { initialValue: '' },
  );

  constructor() {
    this.keepScrollAcrossPopups();
    inject(PokeApi)
      .loadCatalog()
      .catch(() => undefined);
    // Warm the popup remote so the first card click animates without waiting on the network.
    afterNextRender(() => {
      const warm = () => void loadDossierOverlay();
      if ('requestIdleCallback' in window) requestIdleCallback(warm);
      else setTimeout(warm, 500);
    });
  }

  /** Router scroll restoration would scroll to top when a popup opens, so pages are tracked here instead. */
  private keepScrollAcrossPopups(): void {
    let restoreId: number | null = null;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.scrollByPage.set(this.pageId, scrollY);
        restoreId = event.restoredState?.navigationId ?? null;
        this.pageId = event.id;
      } else if (event instanceof NavigationEnd) {
        const background = this.overlay.backgroundUrl().split('?')[0];
        if (background !== this.lastBackground) {
          this.lastBackground = background;
          scrollTo({
            top:
              restoreId === null ? 0 : (this.scrollByPage.get(restoreId) ?? 0),
            behavior: 'instant',
          });
        }
      }
    });
  }
}

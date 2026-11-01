import { DOCUMENT, Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Router, UrlSegment, UrlSegmentGroup, UrlTree } from '@angular/router';

export const OVERLAY_OUTLET = 'overlay';

/**
 * Angular keeps the internal "(overlay:...)" URL in history.state, which is what makes back/forward
 * reopen a popup. A fresh document (reload, duplicated tab) inherits that state too, but must show the
 * full page, so the shell calls this before the router starts.
 */
export function forgetPopupOnFreshLoad(): void {
  if (history.state?.stickerPopup) history.replaceState(null, '');
}

/**
 * Opens /pokemon/:slug as a popup while the address bar still reads /pokemon/:slug.
 *
 * The router navigates internally to "<current page>(overlay:pokemon/:slug)" and uses `browserUrl`
 * to show the clean URL. The page underneath stays mounted because its primary segment is unchanged.
 * A new tab has no in-session page underneath, so the same URL matches the full page route.
 */
@Injectable({ providedIn: 'root' })
export class StickerOverlay {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);

  private sourceArt: HTMLElement | null = null;
  private returnFocus: HTMLElement | null = null;
  private readonly openSlug = signal<string | null>(null);

  /** The sticker currently peeled off the sheet, so that its card can show the ghost silhouette. */
  readonly activeSlug = this.openSlug.asReadonly();

  /** False when a remote runs standalone with no shell around it. */
  get available(): boolean {
    return this.router.config.some((r) => r.outlet === OVERLAY_OUTLET);
  }

  /** Current page URL with any overlay outlet removed. */
  backgroundUrl(): string {
    const tree = this.router.parseUrl(this.router.url);
    delete tree.root.children[OVERLAY_OUTLET];
    return this.router.serializeUrl(tree);
  }

  open(
    slug: string,
    source?: { art: HTMLElement | null; x: number; y: number },
  ): void {
    const replace = this.openSlug() !== null;
    if (replace) {
      // Stepping through evolutions inside the popup: the original card no longer matches what is shown.
      this.sourceArt = null;
    } else {
      this.returnFocus = this.document.activeElement as HTMLElement | null;
    }
    if (source?.art && !replace) {
      this.sourceArt = source.art;
      source.art.style.viewTransitionName = 'sd-art';
    }
    if (source && !replace) {
      const root = this.document.documentElement.style;
      root.setProperty('--sd-origin-x', `${source.x}px`);
      root.setProperty('--sd-origin-y', `${source.y}px`);
    }
    void this.router.navigateByUrl(
      this.overlayTree(this.backgroundUrl(), slug),
      {
        browserUrl: `/pokemon/${slug}`,
        replaceUrl: replace,
        state: { stickerPopup: true },
      },
    );
  }

  /** Each popup is one history entry, so stepping back always lands on the page underneath. */
  close(): void {
    this.location.back();
  }

  private overlayTree(background: string, slug: string): UrlTree {
    const tree = this.router.parseUrl(background);
    tree.root.children[OVERLAY_OUTLET] = new UrlSegmentGroup(
      [new UrlSegment('pokemon', {}), new UrlSegment(slug, {})],
      {},
    );
    return tree;
  }

  /** Called by the popup as it mounts, inside the view transition's update step. */
  mounted(slug: string, dialog: HTMLElement): void {
    this.openSlug.set(slug);
    if (this.sourceArt) this.sourceArt.style.viewTransitionName = '';
    const rect = dialog.getBoundingClientRect();
    const root = this.document.documentElement.style;
    const x = parseFloat(root.getPropertyValue('--sd-origin-x'));
    const y = parseFloat(root.getPropertyValue('--sd-origin-y'));
    root.setProperty(
      '--sd-reveal-x',
      `${(Number.isNaN(x) ? innerWidth / 2 : x) - rect.left}px`,
    );
    root.setProperty(
      '--sd-reveal-y',
      `${(Number.isNaN(y) ? innerHeight / 2 : y) - rect.top}px`,
    );
  }

  /** Called as the popup unmounts, so the artwork can fly back to the card it came from. */
  unmounted(): void {
    this.openSlug.set(null);
    if (this.sourceArt?.isConnected)
      this.sourceArt.style.viewTransitionName = 'sd-art';
    const focusTarget = this.returnFocus;
    this.returnFocus = null;
    setTimeout(
      () =>
        focusTarget?.isConnected && focusTarget.focus({ preventScroll: true }),
    );
  }

  /** Called when the closing view transition has finished. */
  settle(): void {
    if (this.openSlug() === null && this.sourceArt) {
      this.sourceArt.style.viewTransitionName = '';
      this.sourceArt = null;
    }
  }
}

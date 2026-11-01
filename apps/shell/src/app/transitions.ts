import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';
import { OVERLAY_OUTLET, StickerOverlay } from '@stickerdex/data';

function primaryPath(root: ActivatedRouteSnapshot): string {
  const parts: string[] = [];
  let node: ActivatedRouteSnapshot | undefined = root;
  while (node) {
    parts.push(...node.url.map((s) => s.path));
    node = node.children.find((c) => c.outlet === 'primary');
  }
  return parts.join('/');
}

const overlaySlug = (root: ActivatedRouteSnapshot) =>
  root.children.find((c) => c.outlet === OVERLAY_OUTLET)?.params['slug'] as
    string | undefined;

/** Picks the animation for a navigation, and drops it entirely for query-only changes like typing in search. */
export function onViewTransitionCreated({
  transition,
  from,
  to,
}: ViewTransitionInfo): void {
  const html = inject(DOCUMENT).documentElement;
  const overlay = inject(StickerOverlay);

  const before = overlaySlug(from);
  const after = overlaySlug(to);
  const samePage = primaryPath(from) === primaryPath(to);

  let kind: 'open' | 'close' | 'swap' | 'page' | null = null;
  if (samePage && !before && after) kind = 'open';
  else if (samePage && before && !after) kind = 'close';
  else if (samePage && before && after && before !== after) kind = 'swap';
  else if (!samePage) kind = 'page';

  if (!kind || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    transition.skipTransition();
  } else {
    html.dataset['vt'] = kind;
  }
  transition.finished.finally(() => {
    delete html.dataset['vt'];
    overlay.settle();
  });
}

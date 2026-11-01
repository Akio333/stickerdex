import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'stickerdex.theme';
const THEME_COLOR: Record<ThemeName, string> = {
  light: '#e9eefb',
  dark: '#100e33',
};

/**
 * The page follows the system until the visitor picks the other theme. Picking the theme
 * the system already wants clears the choice, so it goes back to following the system.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly systemQuery = matchMedia('(prefers-color-scheme: dark)');

  private readonly system = signal<ThemeName>(
    this.systemQuery.matches ? 'dark' : 'light',
  );
  private readonly chosen = signal(this.readChoice());

  readonly current = computed(() => this.chosen() ?? this.system());

  constructor() {
    this.systemQuery.addEventListener('change', (e) => {
      this.system.set(e.matches ? 'dark' : 'light');
      this.syncBrowserChrome();
    });
  }

  toggle(event: MouseEvent): void {
    const next: ThemeName = this.current() === 'dark' ? 'light' : 'dark';
    const html = this.document.documentElement;
    const apply = () => this.apply(next);

    if (
      !this.document.startViewTransition ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      apply();
      return;
    }
    const button = (event.currentTarget as HTMLElement).getBoundingClientRect();
    html.style.setProperty(
      '--sd-reveal-x',
      `${button.left + button.width / 2}px`,
    );
    html.style.setProperty(
      '--sd-reveal-y',
      `${button.top + button.height / 2}px`,
    );
    html.dataset['vt'] = 'theme';
    this.document
      .startViewTransition(apply)
      .finished.finally(() => delete html.dataset['vt']);
  }

  private apply(next: ThemeName): void {
    const choice = next === this.system() ? null : next;
    this.chosen.set(choice);
    const html = this.document.documentElement;
    if (choice) html.dataset['theme'] = choice;
    else delete html.dataset['theme'];
    try {
      if (choice) localStorage.setItem(STORAGE_KEY, choice);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked: the theme still applies for this visit.
    }
    this.syncBrowserChrome();
  }

  private syncBrowserChrome(): void {
    this.document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = THEME_COLOR[this.current()];
      });
  }

  private readChoice(): ThemeName | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
      return null;
    }
  }
}

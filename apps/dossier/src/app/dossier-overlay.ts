import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { StickerOverlay } from '@stickerdex/data';
import { Dossier } from './dossier';

@Component({
  selector: 'sd-dossier-overlay',
  imports: [Dossier],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      aria-labelledby="dossier-name"
      (cancel)="cancel($event)"
      (click)="backdropClick($event)"
    >
      <div class="controls">
        <a [href]="'/pokemon/' + slug()" target="_blank" rel="noopener"
          >Open in new tab</a
        >
        <button type="button" aria-label="Close" (click)="overlay.close()">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <sd-dossier [slug]="slug()" mode="overlay" />
    </dialog>
  `,
  styles: `
    dialog {
      width: min(72rem, 100vw - 2rem);
      max-width: none;
      height: min(46rem, 100dvh - 2rem);
      max-height: none;
      padding: 0;
      border: 5px solid var(--seal);
      border-radius: 1.75rem;
      background: var(--liner);
      color: var(--ink);
      overflow: hidden;
      view-transition-name: sd-panel;
    }
    dialog::backdrop {
      background: var(--scrim);
    }
    sd-dossier {
      height: 100%;
    }

    .controls {
      position: absolute;
      top: 0.75rem;
      right: 1rem;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .controls a {
      font-weight: 700;
      font-size: 0.9375rem;
      text-underline-offset: 3px;
    }
    .controls button {
      width: 2.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: 50%;
      background: var(--ink);
      color: var(--on-ink);
      font: 700 1.75rem/1 var(--body);
      transition: transform 0.2s var(--spring);
    }
    .controls button:hover {
      transform: rotate(90deg) scale(1.08);
    }

    @supports not (view-transition-name: none) {
      dialog {
        animation: pop 0.3s var(--spring);
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
      }
    }
    @media (max-width: 760px) {
      dialog {
        width: 100vw;
        height: 100dvh;
        border: 0;
        border-radius: 0;
      }
      .controls a {
        display: none;
      }
    }
  `,
})
export class DossierOverlay implements OnDestroy {
  readonly slug = input.required<string>();

  protected readonly overlay = inject(StickerOverlay);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly opened = signal(false);

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
      this.opened.set(true);
    });
    effect(() => {
      const slug = this.slug();
      if (this.opened())
        untracked(() =>
          this.overlay.mounted(slug, this.dialog().nativeElement),
        );
    });
  }

  ngOnDestroy(): void {
    this.overlay.unmounted();
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.overlay.close();
  }

  protected backdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.overlay.close();
  }
}

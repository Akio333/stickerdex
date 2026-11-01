import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sd-remote-unavailable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>This page didn't load</h1>
    <button type="button" (click)="reload()">Reload</button>
  `,
  styles: `
    :host {
      display: grid;
      place-content: center;
      justify-items: start;
      gap: 1rem;
      min-height: 70svh;
      padding: 2rem;
    }
    h1 {
      font: 400 clamp(2rem, 6vw, 4rem)/1.05 var(--display);
    }
    button {
      padding: 0.6rem 1.4rem;
      border: 0;
      border-radius: 999px;
      background: var(--ink);
      color: var(--on-ink);
      font-weight: 700;
    }
  `,
})
export class RemoteUnavailable {
  protected reload(): void {
    location.reload();
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TypeName } from '@stickerdex/data';

@Component({
  selector: 'sd-type-tag',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"flood-" + type()' },
  template: `<a routerLink="/search" [queryParams]="{ type: type() }">{{
    type()
  }}</a>`,
  styles: `
    :host {
      display: inline-block;
    }
    a {
      display: inline-block;
      padding: 0.1rem 0.75rem;
      border: 2px solid var(--seal);
      border-radius: 999px 999px 999px 0.3rem;
      background: var(--flood);
      color: var(--on);
      font-weight: 700;
      font-size: 0.9375rem;
      text-decoration: none;
      text-transform: capitalize;
    }
    a:hover {
      transform: rotate(-3deg) scale(1.06);
    }
    a {
      transition: transform 0.2s var(--spring);
    }
  `,
})
export class TypeTag {
  readonly type = input.required<TypeName>();
}

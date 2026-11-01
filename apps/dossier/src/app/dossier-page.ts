import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Dossier } from './dossier';

@Component({
  selector: 'sd-dossier-page',
  imports: [Dossier],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-dossier [slug]="slug()" mode="page" />`,
})
export class DossierPage {
  readonly slug = input.required<string>();
}

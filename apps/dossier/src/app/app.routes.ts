import { Route } from '@angular/router';
import { DossierPage } from './dossier-page';

/** Standalone-only routes; the shell mounts DossierPage and DossierOverlay itself. */
export const routes: Route[] = [
  { path: 'pokemon/:slug', component: DossierPage },
  { path: '**', redirectTo: 'pokemon/pikachu' },
];

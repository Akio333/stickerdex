import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { OVERLAY_OUTLET } from '@stickerdex/data';
import { RemoteUnavailable } from './remote-unavailable';

/** A remote that fails to load costs its own page, not the whole app. */
const remoteRoutes = (remote: string) => () =>
  loadRemoteModule(remote, './routes')
    .then((m) => m.routes)
    .catch(() => [{ path: '**', component: RemoteUnavailable }]);

const remoteComponent = (exposed: string, name: string) => () =>
  loadRemoteModule('dossier', exposed)
    .then((m) => m[name])
    .catch(() => RemoteUnavailable);

export const loadDossierOverlay = remoteComponent(
  './Overlay',
  'DossierOverlay',
);

export const appRoutes: Routes = [
  {
    path: 'search',
    title: 'Search Pokémon',
    loadChildren: remoteRoutes('search'),
  },
  {
    path: 'pokemon/:slug',
    loadComponent: remoteComponent('./Page', 'DossierPage'),
  },
  {
    path: 'pokemon/:slug',
    outlet: OVERLAY_OUTLET,
    loadComponent: loadDossierOverlay,
  },
  // Prefix match, not 'full': a full match would reject "/(overlay:...)" and unmount the page under a popup.
  { path: '', title: 'Stickerdex', loadChildren: remoteRoutes('home') },
  { path: '**', redirectTo: '' },
];

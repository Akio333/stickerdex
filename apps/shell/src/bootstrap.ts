import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { forgetPopupOnFreshLoad } from '@stickerdex/data';

forgetPopupOnFreshLoad();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

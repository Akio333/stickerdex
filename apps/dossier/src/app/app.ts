import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Only used when this remote runs on its own; the shell mounts `routes` directly. */
@Component({
  selector: 'sd-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}

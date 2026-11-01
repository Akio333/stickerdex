import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PokeApi } from '@stickerdex/data';
import { Hero } from './hero';
import { PopularCarousel } from './popular-carousel';
import { TypeStrip } from './type-strip';
import { HoloSpread } from './holo-spread';
import { RegionList } from './region-list';

@Component({
  selector: 'sd-landing',
  imports: [Hero, PopularCarousel, TypeStrip, HoloSpread, RegionList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-hero />
    <sd-popular-carousel />
    <sd-type-strip />
    <sd-holo-spread />
    <sd-region-list />
  `,
})
export class Landing {
  constructor() {
    // Popular and Legendaries read the catalog. Requests are shared, so this is free under the shell.
    inject(PokeApi)
      .loadCatalog()
      .catch(() => undefined);
  }
}

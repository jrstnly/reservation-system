import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { PlayerComponent } from './player.component';

@NgModule({
	imports: [ CommonModule, IonicModule ],
	declarations: [PlayerComponent],
	exports: [PlayerComponent]
})
export class PlayerComponentModule {}

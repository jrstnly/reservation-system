import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { MbscModule } from '@mobiscroll/angular-lite';

import { PlayerComponentModule } from '../components/player/player.module';

import { ReservationPage } from './reservation.page';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		IonicModule,
		MbscModule,
		PlayerComponentModule,
	],
	declarations: [ReservationPage],
	entryComponents: [ReservationPage]
})
export class ReservationPageModule {}

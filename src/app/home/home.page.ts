import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, AlertController, LoadingController } from '@ionic/angular';

import { ReservationPage } from '../reservation/reservation.page';

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
	public showSuccess: boolean = false;
	public reservationSuccess: boolean = false;

	constructor(private activatedRoute: ActivatedRoute, public modalCtrl: ModalController, public alertCtrl: AlertController) {}

	ngOnInit() {
		let id = this.activatedRoute.snapshot.paramMap.get('id');
		if (id == 'reservation') {
			this.openFormModal(ReservationPage);
		} else if (id == null) {
			this.presentAlert('Error', 'No form ID found. Please follow a link to a valid form.');
		} else {
			this.presentAlert('Error', 'This form does not exist. Please try again.');
		}
	}

	public async openFormModal(modal) {
		const promptModal = await this.modalCtrl.create({
			component: modal,
			cssClass: 'prompt-modal',
			backdropDismiss: false
		});
		promptModal.onWillDismiss().then((data) => {
			if (data.data) {
				if (data.data.success) {
					this.showSuccess = true;
				} else if (data.data.reservationSuccess){
					this.reservationSuccess = true;
				}
			}
		})
		return await promptModal.present();
	}

	public async presentAlert(type, message) {
		const alert = await this.alertCtrl.create({
			header: type,
			message: message,
			buttons: ['OK']
		});
		await alert.present();
	}

}

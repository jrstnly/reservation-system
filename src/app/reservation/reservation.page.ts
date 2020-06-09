import { Component, OnInit, ViewChild, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { IonSlides, ModalController, AlertController, LoadingController, ToastController } from '@ionic/angular';

import { MbscFormOptions } from '@mobiscroll/angular-lite';
import { timer, Subscription } from 'rxjs';
import { EventsDefaultData } from '../events-default-data'
import { Event } from '../event'
import * as moment from 'moment';

@Component({
	selector: 'app-reservation',
	templateUrl: './reservation.page.html',
	styleUrls: ['./reservation.page.scss'],
})
export class ReservationPage implements OnInit {
	@ViewChild('slides', { static: true }) slider: IonSlides;
	public segment: number = 0;
	public loadingIndicator: any;
	public form: FormGroup;
	public list: Map<string, Event> = new Map();
	public availableSpots: string = "";
	public maxSpots: number;
	public confirm: boolean = false;
	public response: any = null;
	private verified: boolean = false;
	private rawEventsData: EventsDefaultData = {maxSpots:1};
	private serviceLength: number = 3600;
	private current: string | null = null;
	private currentValues: any = {};
	private pollingData: Subscription | null = null;
	public mbscOptions = {
		theme: 'mobiscroll'
	};
	public playerOptions: any = {
		poster: '//link.theplatform.com/s/IfSiAC/media/xSTnDXYpb21g?formats=jpeg',
		sources: [
			{
				src: '//link.theplatform.com/s/IfSiAC/media/xSTnDXYpb21g?metafile=false&formats=m3u,mpeg4,mp3',
				type: 'application/x-mpegURL'
			}
		]
	};

	constructor(private modalCtrl: ModalController, private loadingController: LoadingController, private alertCtrl: AlertController, private toastController: ToastController, private httpClient: HttpClient, private afs: AngularFirestore) {}

	ngOnInit() {
		this.slider.lockSwipes(true);
		this.form = new FormGroup({
			'Name': new FormControl(null, Validators.required),
			'Email': new FormControl(null, Validators.compose([
				Validators.required,
				Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-. ]+$')
			])),
			'Campus': new FormControl(null, Validators.required),
			'ServiceTime': new FormControl("", Validators.required),
			'Hearing': new FormControl (false),
			'Count': new FormControl(1, Validators.required),
		});
	}
	ionViewWillEnter() {
		this.afs.doc(`reservation/settings/`).valueChanges().subscribe((data: any) => {
			this.rawEventsData = data;
			this.parseEvents();
			this.processEvents();
		});
		this.afs.doc(`forms/vo887dEdCz5hCQzbf5ns`).valueChanges().subscribe((data: any) => {
			this.currentValues = data;
			this.getCount();
			this.parseEvents();
			this.processEvents();
			this.pollingData = timer(0, 1000).subscribe(() => this.processEvents());
		});
	}
	private parseEvents(): void {
		let current = new Date();
		const events = JSON.parse(JSON.stringify(this.rawEventsData));
		events.times.forEach((event: any) => {
			// If event is disabled, don't add it to the list
			if (event.disabled && !isDevMode()) {
				if (this.list.get(event.ID)) this.list.delete(event.ID);
				return;
			}

			event.time = new Date(event.time.seconds * 1000);
			event.end = new Date(event.time.getTime() + (3600 * 1000));

			// If event is already over, don't include it
			if (current > new Date(event.end.getTime())) {
				if (this.list.get(event.ID)) this.list.delete(event.ID);
				return;
			}

			let newdate = moment(event.time).format() + "_" + event.name;
			if(this.form.value.ServiceTime && this.form.value.ServiceTime.ID == event.ID){
				if(this.form.value.Count >= this.currentValues[newdate]) {this.form.value.Count = this.currentValues[newdate];}
			}
			if(this.currentValues[newdate] <= 0) {
				event.hidden = true;
				if(this.form.value.ServiceTime && this.form.value.ServiceTime.ID == event.ID) this.resetServiceTime();
			}

			// Add event to list
			this.list.set(event.ID, event);
		});
		this.current = this.getNextEvent(current);
		//console.log(this.current);
		//console.log(this.list);
	}
	private processEvents(): void {
		const time = new Date();
		if (this.current) {
			if (time > new Date(this.list.get(this.current).end.getTime())) {
				this.current = null;
				this.parseEvents();
			}
		} else {
			this.current = this.getNextEvent(time);
		}
	}
	private getNextEvent(time): string | null {
		if (this.list.size > 0) {
			let items = [...this.list.entries()].sort((a, b) => { return a[1].time.getTime() - b[1].time.getTime(); });
			return items[0][0];
		} else {
			return null;
		}
	}
	public getCount() {
		if(this.form.value.ServiceTime != null) {
			let newdate = moment(this.form.value.ServiceTime.time).format() + "_" + this.form.value.ServiceTime.name;
			this.maxSpots = (this.currentValues[newdate] <= this.rawEventsData.maxSpots) ? this.currentValues[newdate] : this.rawEventsData.maxSpots;
			let val: number;
			if (this.form.value.Campus == "CH") {
				val = this.rawEventsData.CHCapacity;
			} else if (this.form.value.Campus == "EP") {
				val = this.rawEventsData.EPCapacity;
			}
			this.availableSpots = ((this.currentValues[newdate] / val * 100) < 6) ? this.currentValues[newdate] : Math.floor(this.currentValues[newdate] / val * 100) + "%";
		}
	}
	public resetServiceTime() {
		this.form.controls.ServiceTime.reset();
	}
	public async presentLoading() {
		this.loadingIndicator = await this.loadingController.create({
			message: 'Saving...'
		});
		await this.loadingIndicator.present();
	}
	public async presentAlert(type, message) {
		const alert = await this.alertCtrl.create({
			header: type,
			message: message,
			buttons: ['OK']
		});
		await alert.present();
	}

	public async confirmSelection() {
		if (this.form.valid) {
			const toast = await this.toastController.create({
				header: 'Confirm',
				message: 'Please review your selection and verify all details are correct then click the \'Confirm\' button.',
				position: 'top',
				color: 'secondary',
				duration: 10000,
				buttons: [
					{
						text: 'Close',
						role: 'cancel',
						handler: () => {}
					}
				]
			});
			toast.present();
			this.confirm = true;
		} else {
			this.presentAlert('Error', 'Please fill out all require fields');
		}
	}
	public async submitForm() {
		if (this.form.valid) {
			await this.presentLoading();
			this.form.value.ServiceTime.time = this.form.value.ServiceTime.time.getTime() / 1000;
			this.form.value.Email = this.form.value.Email.trim();
			this.httpClient.post('CLOUDFUNCTIONSURL', this.form.value).subscribe(
			(res: any) => {
				this.loadingIndicator.dismiss();
				if (res) {
					this.changeSlide(1);
					this.response = res.data;
				} else {
					this.presentAlert('Error', 'An unknown error occurred. Please try again.');
				}
			},
			(error) => {
				this.loadingIndicator.dismiss();
				this.presentAlert('Error', 'There was an error connecting to the server. Please try again.');
			});
		} else {
			this.presentAlert('Error', 'Please fill out all require fields');
		}
	}


	public async changeSlide(index) {
		this.slider.lockSwipes(false);
		this.slider.slideTo(index);
		this.slider.lockSwipes(true);
	}
	public async slideChanged() {
		this.slider.getActiveIndex().then((i) => {
			this.segment = i;
		});
	}

	public dismiss(success = false) {
		this.modalCtrl.dismiss({reservationSuccess:success});
	}
}

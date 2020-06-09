import { Component, ViewChild, ViewEncapsulation, ElementRef, Input, Inject, OnDestroy, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import videojs from 'video.js';

import { PlayerOptions, PlayerSource } from './player.interface';

@Component({
	selector: 'media-player',
	template: `<video #player class="video-js" controls muted playsinline preload="none"></video>`,
	styleUrls: ['./player.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class PlayerComponent implements OnInit {
	@ViewChild('player', {static: true}) target: ElementRef;
	@Input() options: PlayerOptions = {};
	private _defaultOptions: PlayerOptions = {
		autoplay: false,
		controls: true,
		loop: false,
		muted: false,
		liveui: false,
		techOrder: [ 'html5' ],
		chromecast: {},
		plugins: {}
	};
	public player: videojs.Player;
	private videoWidth: number;
	private videoHeight: number;

	constructor(@Inject(DOCUMENT) private document: Document) {}

	ngOnInit() {
		this.options = { ...this._defaultOptions, ...this.options };
		this.player = videojs(this.target.nativeElement, this.options);

		this.player.on('error', (err) => {
			console.log(err);
		});
	}
	ngAfterViewInit() {
		this.onResize();
	}

	ngOnDestroy() {
		if (this.player) {
			this.player.dispose();
		}
	}

	@HostListener('window:resize', ['$event'])
	@HostListener('window:orientationchange', ['$event'])
	onResize() {
		this.videoWidth = this.target.nativeElement.offsetWidth;
		this.videoHeight = this.target.nativeElement.offsetHeight;

		if (this.videoWidth < 480) {
			this.document.documentElement.style.setProperty('--vjs-root-size', '12px');
		} else if (this.videoWidth < 768) {
			this.document.documentElement.style.setProperty('--vjs-root-size', '14px');
		} else {
			this.document.documentElement.style.setProperty('--vjs-root-size', '16px');
		}
	}
}

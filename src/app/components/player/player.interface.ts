export interface PlayerOptions { /* options: https://github.com/videojs/video.js/blob/master/docs/guides/options.md */
	autoplay?: boolean | string;
	controls?: boolean;
	loop?: boolean;
	muted?: boolean;
	poster?: boolean;
	preload?: string;
	liveui?: boolean;
	sources?: Array<PlayerSource>;
	techOrder?: Array<string>;
	plugins?: any;
	chromecast?: any;
}

export interface PlayerSource {
	src: string;
	type: string;
}

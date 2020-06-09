export interface Event {
	name: string;
	time: Date;
	end: Date | null;
	hidden: boolean;
}

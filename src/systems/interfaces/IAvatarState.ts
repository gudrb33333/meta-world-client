export interface IAvatarState {
	canFindChairsToEnter: boolean; // Find a suitable car and run towards it
	canEnterChairs: boolean; // Actually get into the chair
	canLeaveChairs: boolean;

	update(timeStep: number): void;
	onInputChange(): void;
}

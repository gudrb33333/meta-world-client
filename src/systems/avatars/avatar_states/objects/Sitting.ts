import { AvatarStateBase } from '../_stateLibrary';
import { Avatar } from '../../Avatar';
import { Chair } from 'src/systems/objects/Chair';

export class Sitting extends AvatarStateBase {
	constructor(avatar: Avatar, chair: Chair) {
		super(avatar);

		this.canFindChairsToEnter = false;
		this.playAnimation('sitting', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);
		this.avatar.chairEntryInstance = null;
	}

	public onInputChange(): void {
		if (this.avatar.actions.enter.justPressed) {
			this.avatar.exitChair();
		}
	}
}

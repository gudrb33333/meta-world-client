import {
	AvatarStateBase,
	EndWalk,
	JumpRunning,
	Sprint,
	Walk,
} from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class DropRunning extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.setArcadeVelocityTarget(0.8);
		this.playAnimation('drop_running', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();

		if (this.animationEnded(timeStep)) {
			this.avatar.setState(new Walk(this.avatar));
		}
	}

	public onInputChange(): void {
		super.onInputChange();

		if (this.noDirection()) {
			this.avatar.setState(new EndWalk(this.avatar));
		}

		if (this.anyDirection() && this.avatar.actions.run.justPressed) {
			this.avatar.setState(new Sprint(this.avatar));
		}

		if (this.avatar.actions.jump.justPressed) {
			this.avatar.setState(new JumpRunning(this.avatar));
		}
	}
}

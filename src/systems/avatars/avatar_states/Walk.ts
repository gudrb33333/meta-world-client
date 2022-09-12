import {
	AvatarStateBase,
	EndWalk,
	Idle,
	JumpRunning,
	Sprint,
} from './_stateLibrary';
import { Avatar } from '../Avatar';

export class Walk extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.canEnterChairs = true;
		this.avatar.setArcadeVelocityTarget(0.8);
		this.playAnimation('run', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();

		this.fallInAir();
	}

	public onInputChange(): void {
		super.onInputChange();

		if (this.noDirection()) {
			this.avatar.setState(new EndWalk(this.avatar));
		}

		if (this.avatar.actions.run.isPressed) {
			this.avatar.setState(new Sprint(this.avatar));
		}

		if (this.avatar.actions.run.justPressed) {
			this.avatar.setState(new Sprint(this.avatar));
		}

		if (this.avatar.actions.jump.justPressed) {
			this.avatar.setState(new JumpRunning(this.avatar));
		}

		if (this.noDirection()) {
			if (this.avatar.velocity.length() > 1) {
				this.avatar.setState(new EndWalk(this.avatar));
			} else {
				this.avatar.setState(new Idle(this.avatar));
			}
		}
	}
}

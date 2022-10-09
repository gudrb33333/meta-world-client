import { AvatarStateBase, Idle, JumpIdle, Sprint, Walk } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class EndWalk extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.setArcadeVelocityTarget(0);
		this.animationLength = avatar.setAnimation('stop', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		if (this.animationEnded(timeStep)) {
			this.avatar.setState(new Idle(this.avatar));
		}

		this.fallInAir();
	}

	public onInputChange(): void {
		super.onInputChange();

		if (this.avatar.actions.jump.justPressed) {
			this.avatar.setState(new JumpIdle(this.avatar));
		}

		if (this.anyDirection()) {
			if (this.avatar.actions.run.isPressed) {
				this.avatar.setState(new Sprint(this.avatar));
			} else {
				if (this.avatar.velocity.length() > 0.5) {
					this.avatar.setState(new Walk(this.avatar));
				} else {
					this.setAppropriateStartWalkState();
				}
			}
		}
	}
}

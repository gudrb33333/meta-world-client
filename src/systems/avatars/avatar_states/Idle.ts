import { AvatarStateBase, JumpIdle, Walk } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class Idle extends AvatarStateBase implements IAvatarState {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.velocitySimulator.damping = 0.6;
		this.avatar.velocitySimulator.mass = 10;

		this.avatar.setArcadeVelocityTarget(0);
		this.playAnimation('idle', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.fallInAir();
	}

	public onInputChange(): void {
		super.onInputChange();

		if (this.avatar.actions.jump.justPressed) {
			this.avatar.setState(new JumpIdle(this.avatar));
		}

		if (this.anyDirection()) {
			if (this.avatar.velocity.length() > 0.5) {
				this.avatar.setState(new Walk(this.avatar));
			} else {
				this.setAppropriateStartWalkState();
			}
		}
	}
}
import { AvatarStateBase, Falling } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class JumpIdle extends AvatarStateBase implements IAvatarState {
	private alreadyJumped: boolean;

	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.getVelocitySimulator().mass = 50;

		this.avatar.setArcadeVelocityTarget(0);
		this.playAnimation('jump_idle', 0.1);
		this.alreadyJumped = false;
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		// Move in air
		if (this.alreadyJumped) {
			this.avatar.setCameraRelativeOrientationTarget();
			this.avatar.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
		}

		// Physically jump
		if (this.timer > 0.2 && !this.alreadyJumped) {
			this.avatar.jump();
			this.alreadyJumped = true;

			this.avatar.getVelocitySimulator().mass = 100;
			this.avatar.getRotationSimulator().damping = 0.3;

			if (this.avatar.getRayResult().body.velocity.length() > 0) {
				this.avatar.setArcadeVelocityInfluence(0, 0, 0);
			} else {
				this.avatar.setArcadeVelocityInfluence(0.3, 0, 0.3);
			}
		} else if (this.timer > 0.3 && this.avatar.getRayHasHit()) {
			this.setAppropriateDropState();
		} else if (this.animationEnded(timeStep)) {
			this.avatar.setState(new Falling(this.avatar));
		}
	}
}

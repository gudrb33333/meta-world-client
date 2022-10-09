import { AvatarStateBase, Falling } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class JumpRunning extends AvatarStateBase {
	private alreadyJumped: boolean;

	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.velocitySimulator.mass = 100;
		this.playAnimation('jump_running', 0.03);
		this.alreadyJumped = false;
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();

		// Move in air
		if (this.alreadyJumped) {
			this.avatar.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
		}
		// Physically jump
		if (this.timer > 0.13 && !this.alreadyJumped) {
			this.avatar.jump(4);
			this.alreadyJumped = true;

			this.avatar.rotationSimulator.damping = 0.3;
			this.avatar.arcadeVelocityIsAdditive = true;
			this.avatar.setArcadeVelocityInfluence(0.05, 0, 0.05);
		} else if (this.timer > 0.24 && this.avatar.rayHasHit) {
			this.setAppropriateDropState();
		} else if (this.animationEnded(timeStep)) {
			this.avatar.setState(new Falling(this.avatar));
		}
	}
}

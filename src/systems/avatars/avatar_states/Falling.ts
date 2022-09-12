import { AvatarStateBase } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class Falling extends AvatarStateBase implements IAvatarState {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.velocitySimulator.mass = 100;
		this.avatar.rotationSimulator.damping = 0.3;

		this.avatar.arcadeVelocityIsAdditive = true;
		this.avatar.setArcadeVelocityInfluence(0.05, 0, 0.05);

		this.playAnimation('falling', 0.3);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();
		this.avatar.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);

		if (this.avatar.rayHasHit) {
			this.setAppropriateDropState();
		}
	}
}

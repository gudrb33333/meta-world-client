import { AvatarStateBase } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class Falling extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.getVelocitySimulator().mass = 100;
		this.avatar.getRotationSimulator().damping = 0.3;

		this.avatar.setArcadeVelocityIsAdditive(true);
		this.avatar.setArcadeVelocityInfluence(0.05, 0, 0.05);

		this.playAnimation('falling', 0.3);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();
		this.avatar.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);

		if (this.avatar.getRayHasHit()) {
			this.setAppropriateDropState();
		}
	}
}

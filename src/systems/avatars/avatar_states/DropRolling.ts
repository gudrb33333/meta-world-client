import { AvatarStateBase, EndWalk, Walk } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class DropRolling extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.velocitySimulator.mass = 1;
		this.avatar.velocitySimulator.damping = 0.6;

		this.avatar.setArcadeVelocityTarget(0.8);
		this.playAnimation('drop_running_roll', 0.03);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();

		if (this.animationEnded(timeStep)) {
			if (this.anyDirection()) {
				this.avatar.setState(new Walk(this.avatar));
			} else {
				this.avatar.setState(new EndWalk(this.avatar));
			}
		}
	}
}

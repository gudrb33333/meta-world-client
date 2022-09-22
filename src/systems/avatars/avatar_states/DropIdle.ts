import { AvatarStateBase, Idle, JumpIdle, Walk } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class DropIdle extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.getVelocitySimulator().damping = 0.5;
		this.avatar.getVelocitySimulator().mass = 7;

		this.avatar.setArcadeVelocityTarget(0);
		this.playAnimation('drop_idle', 0.1);

		if (this.anyDirection()) {
			this.avatar.setState(new Walk(avatar));
		}
	}

	public update(timeStep: number): void {
		super.update(timeStep);
		this.avatar.setCameraRelativeOrientationTarget();
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
			this.avatar.setState(new Walk(this.avatar));
		}
	}
}

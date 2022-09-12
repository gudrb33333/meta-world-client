import { AvatarStateBase, EndWalk, JumpRunning, Walk } from './_stateLibrary';
import { Avatar } from '../Avatar';

export class Sprint extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.canEnterChairs = true;

		this.avatar.velocitySimulator.mass = 10;
		this.avatar.rotationSimulator.damping = 0.8;
		this.avatar.rotationSimulator.mass = 50;

		this.avatar.setArcadeVelocityTarget(1.4);
		this.playAnimation('sprint', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);
		this.avatar.setCameraRelativeOrientationTarget();
		this.fallInAir();
	}

	public onInputChange(): void {
		super.onInputChange();

		if (!this.avatar.actions.run.isPressed) {
			this.avatar.setState(new Walk(this.avatar));
		}

		if (this.avatar.actions.jump.justPressed) {
			this.avatar.setState(new JumpRunning(this.avatar));
		}

		if (this.noDirection()) {
			this.avatar.setState(new EndWalk(this.avatar));
		}
	}
}

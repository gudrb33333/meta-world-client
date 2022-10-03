import { AvatarStateBase, JumpIdle, Walk, StandClap, StandWave, StandDance } from './_stateLibrary';
import { IAvatarState } from '../../interfaces/IAvatarState';
import { Avatar } from '../Avatar';

export class Idle extends AvatarStateBase {
	constructor(avatar: Avatar) {
		super(avatar);

		this.avatar.getVelocitySimulator().damping = 0.6;
		this.avatar.getVelocitySimulator().mass = 10;

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
			if (this.avatar.getVelocity().length() > 0.5) {
				this.avatar.setState(new Walk(this.avatar));
			} else {
				this.setAppropriateStartWalkState();
			}
		}

		if (this.isStandClapPressed()) {
			this.avatar.setState(new StandClap(this.avatar));
		}

		if (this.isStandWavePressed()) {
			this.avatar.setState(new StandWave(this.avatar));
		}

		if (this.isStandDancePressed()) {
			this.avatar.setState(new StandDance(this.avatar));
		}
	}
}

import { Avatar } from "../Avatar";
import { AvatarStateBase } from "./AvatarStateBase";
import { Idle, JumpIdle, Walk } from "./_stateLibrary";


export class StandClap extends AvatarStateBase {
    constructor(avatar: Avatar){
        super(avatar);

        this.avatar.setArcadeVelocityTarget(0);
        this.playAnimation('stand_clap', 0.3);
    }

    public update(timeStep: number): void {
		super.update(timeStep);

		this.avatar.setCameraRelativeOrientationTarget();

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

        // if (this.isStandClapPressed() && this.avatar.getAvatarAnimationState() === 'stand_clap'){
        //     this.avatar.setState(new Idle(this.avatar));
        // }
	}
}

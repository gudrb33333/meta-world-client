import { Avatar } from "../Avatar";
import { AvatarStateBase } from "./AvatarStateBase";
import { Idle, JumpIdle, Walk, StandWave, StandDance } from "./_stateLibrary";


export class StandClap extends AvatarStateBase {
    constructor(avatar: Avatar){
        super(avatar);

        this.avatar.setArcadeVelocityTarget(0);
        this.playAnimation('stand_clap', 0.3);
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

        if(this.isQuitSociaAnimation()){
            this.avatar.setState(new Idle(this.avatar));
        }

        if (this.isStandWavePressed()){
            this.avatar.setState(new StandWave(this.avatar));
        }

        if (this.isStandDancePressed()){
            this.avatar.setState(new StandDance(this.avatar));
        }
	}
}

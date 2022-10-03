import { Avatar } from "../Avatar";
import { AvatarStateBase } from "./AvatarStateBase";
import { Idle, JumpIdle, Walk, StandClap } from "./_stateLibrary";

export class StandWave extends AvatarStateBase {
    constructor(avatar: Avatar){
        super(avatar);

        this.avatar.setArcadeVelocityTarget(0);
        this.playAnimation('stand_wave', 0.3);
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

        if(this.isQuitSociaAnimation()){
            this.avatar.setState(new Idle(this.avatar));
        }

        if (this.isStandClapPressed()){
            this.avatar.setState(new StandClap(this.avatar));
        }
	}
}

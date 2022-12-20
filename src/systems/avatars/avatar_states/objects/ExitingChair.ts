import * as THREE from 'three';

import { Avatar } from '../../Avatar';
import { Idle } from '../Idle';
import { ExitingStateBase } from './ExitingStateBase';
import { Chair } from 'src/systems/objects/Chair';

export class ExitingChair extends ExitingStateBase {
	constructor(avatar: Avatar, chair: Chair) {
		super(avatar, chair);

		const newPos = new THREE.Vector3();
		chair.entryPoints.getWorldPosition(newPos);
		this.exitPoint = chair.entryPoints;

		this.endPosition.copy(newPos);
		this.playAnimation('stand_up_right', 0.1);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		if (this.animationEnded(timeStep)) {
			this.detachAvatarFromChair();
			this.avatar.setPosition(
				this.endPosition.x,
				this.endPosition.y,
				this.endPosition.z,
			);

			this.avatar.setState(new Idle(this.avatar));
			this.avatar.leaveSeat();
			this.chair.isSeated = false;
		} else {
			// Rotation
			this.updateEndRotation();
			THREE.Quaternion.slerp(
				this.startRotation,
				this.endRotation,
				this.avatar.quaternion,
				1,
			);
		}
	}
}

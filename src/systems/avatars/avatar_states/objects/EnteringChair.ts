import * as THREE from 'three';
import { AvatarStateBase } from '../_stateLibrary';
import { Avatar } from '../../Avatar';
import { Sitting } from './Sitting';
import { Object3D } from 'three';
import { Chair } from 'src/systems/objects/Chair';

export class EnteringChair extends AvatarStateBase {
	private chair: Chair;

	private initialPositionOffset: THREE.Vector3 = new THREE.Vector3();
	private startPosition: THREE.Vector3 = new THREE.Vector3();
	private endPosition: THREE.Vector3 = new THREE.Vector3();
	private startRotation: THREE.Quaternion = new THREE.Quaternion();
	private endRotation: THREE.Quaternion = new THREE.Quaternion();

	constructor(avatar: Avatar, chair: Chair, entryPoint: Object3D) {
		super(avatar);

		this.canFindChairsToEnter = false;
		this.chair = chair;

		this.playAnimation('sit_down_right', 0.1);

		this.avatar.resetVelocity();
		this.avatar.setPhysicsEnabled(false);
		(this.chair as unknown as THREE.Object3D).attach(this.avatar);

		this.startPosition.copy(entryPoint.position);
		this.endPosition.copy(chair.getSeatPointObject().position);
		this.initialPositionOffset
			.copy(this.startPosition)
			.sub(this.avatar.position);

		this.startRotation.copy(this.avatar.quaternion);
		this.endRotation.copy(this.chair.getSeatPointObject().quaternion);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		if (this.animationEnded(timeStep)) {
			this.avatar.occupySeat(this.chair);
			this.avatar.setPosition(
				this.endPosition.x,
				this.endPosition.y,
				this.endPosition.z,
			);

			this.avatar.setState(new Sitting(this.avatar, this.chair));
		} else {
			this.avatar.setPosition(
				this.endPosition.x,
				this.endPosition.y,
				this.endPosition.z,
			);
			THREE.Quaternion.slerp(
				this.startRotation,
				this.endRotation,
				this.avatar.quaternion,
				1,
			);
		}
	}
}

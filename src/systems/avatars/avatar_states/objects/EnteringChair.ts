import * as THREE from 'three';
import { AvatarStateBase } from '../_stateLibrary';
import { Avatar } from '../../Avatar';
import { Sitting } from './Sitting';
import { Object3D } from 'three';
import { Chair } from 'src/systems/objects/Chair';

export class EnteringChair extends AvatarStateBase {
	private _chair: Chair;

	private _initialPositionOffset: THREE.Vector3 = new THREE.Vector3();
	private _startPosition: THREE.Vector3 = new THREE.Vector3();
	private _endPosition: THREE.Vector3 = new THREE.Vector3();
	private _startRotation: THREE.Quaternion = new THREE.Quaternion();
	private _endRotation: THREE.Quaternion = new THREE.Quaternion();

	constructor(avatar: Avatar, chair: Chair, entryPoint: Object3D) {
		super(avatar);

		this.canFindChairsToEnter = false;
		this._chair = chair;

		this.playAnimation('sit_down_right', 0.1);

		this.avatar.resetVelocity();
		this.avatar.setPhysicsEnabled(false);
		(this._chair as unknown as THREE.Object3D).attach(this.avatar);
		this._chair.isSeated = true;

		this._startPosition.copy(entryPoint.position);
		this._endPosition.copy(chair.seatPointObject.position);
		this._initialPositionOffset
			.copy(this._startPosition)
			.sub(this.avatar.position);

		this._startRotation.copy(this.avatar.quaternion);
		this._endRotation.copy(this._chair.seatPointObject.quaternion);
	}

	public update(timeStep: number): void {
		super.update(timeStep);

		if (this.animationEnded(timeStep)) {
			this.avatar.occupySeat(this._chair);
			this.avatar.setPosition(
				this._endPosition.x,
				this._endPosition.y,
				this._endPosition.z,
			);

			this.avatar.setState(new Sitting(this.avatar));
		} else {
			this.avatar.setPosition(
				this._endPosition.x,
				this._endPosition.y,
				this._endPosition.z,
			);
			THREE.Quaternion.slerp(
				this._startRotation,
				this._endRotation,
				this.avatar.quaternion,
				1,
			);
		}
	}
}

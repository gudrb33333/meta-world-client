import * as THREE from 'three';
import { Chair } from '../objects/Chair';
import { Avatar } from './Avatar';

export class ChairEntryInstance {
	private _avatar: Avatar;
	private _targetChair: Chair;
	private _entryPoint: THREE.Object3D;
	private _wantsToSit = false;

	constructor(avatar: Avatar) {
		this._avatar = avatar;
	}

	public update(): void {
		const entryPointWorldPos = new THREE.Vector3();
		this._entryPoint.getWorldPosition(entryPointWorldPos);
		const viewVector = new THREE.Vector3().subVectors(
			entryPointWorldPos,
			this._avatar.position,
		);
		this._avatar.setOrientation(viewVector);

		const heightDifference = viewVector.y;
		viewVector.y = 0;
		if (
			this._avatar.avatarState.canEnterChairs &&
			viewVector.length() < 0.2 &&
			heightDifference < 2
		) {
			this._avatar.enterChair(this._targetChair, this._entryPoint);
		}
	}

	//getter,setter
	get entryPoint(): THREE.Object3D {
		return this._entryPoint;
	}

	set entryPoint(object: THREE.Object3D) {
		this._entryPoint = object;
	}

	set targetChair(targetChair: Chair) {
		this._targetChair = targetChair;
	}
}

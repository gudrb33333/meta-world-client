import * as THREE from 'three';
import { Chair } from '../objects/Chair';
import { Avatar } from './Avatar';

export class ChairEntryInstance {
	public avatar: Avatar;
	public targetChair: Chair;
	public entryPoint: THREE.Object3D;
	public wantsToSit = false;

	constructor(avatar: Avatar) {
		this.avatar = avatar;
	}

	public update(timeStep: number): void {
		const entryPointWorldPos = new THREE.Vector3();
		this.entryPoint.getWorldPosition(entryPointWorldPos);
		const viewVector = new THREE.Vector3().subVectors(
			entryPointWorldPos,
			this.avatar.position,
		);
		this.avatar.setOrientation(viewVector);

		const heightDifference = viewVector.y;
		viewVector.y = 0;
		if (
			this.avatar.charState.canEnterChairs &&
			viewVector.length() < 0.2 &&
			heightDifference < 2
		) {
			this.avatar.enterChair(this.targetChair, this.entryPoint);
		}
	}
}

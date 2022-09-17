import * as THREE from 'three';
import { Chair } from '../objects/Chair';
import { Avatar } from './Avatar';

export class ChairEntryInstance {
	private avatar: Avatar;
	private targetChair: Chair;
	private entryPoint: THREE.Object3D;
	private wantsToSit = false;

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
			this.avatar.getCharState().canEnterChairs &&
			viewVector.length() < 0.2 &&
			heightDifference < 2
		) {
			this.avatar.enterChair(this.targetChair, this.entryPoint);
		}
	}

	public getEntryPoint(): THREE.Object3D {
		return this.entryPoint;
	}

	public setEntryPoint(object: THREE.Object3D) {
		this.entryPoint = object;
	}

	public setTargetChair(targetChair: Chair) {
		this.targetChair = targetChair;
	}
}

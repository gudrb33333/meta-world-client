import * as THREE from 'three';

export class ClosestObjectFinder<T> {
	public closestObject: T;

	private _closestDistance: number = Number.POSITIVE_INFINITY;
	private _referencePosition: THREE.Vector3;
	private _maxDistance: number = Number.POSITIVE_INFINITY;

	constructor(referencePosition: THREE.Vector3, maxDistance?: number) {
		this._referencePosition = referencePosition;
		if (maxDistance !== undefined) this._maxDistance = maxDistance;
	}

	public consider(object: T, objectPosition: THREE.Vector3): void {
		const distance = this._referencePosition.distanceTo(objectPosition);

		if (distance < this._maxDistance && distance < this._closestDistance) {
			this._closestDistance = distance;
			this.closestObject = object;
		}
	}
}

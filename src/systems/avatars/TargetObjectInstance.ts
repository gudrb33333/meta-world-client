import * as THREE from 'three';
import { Avatar } from "./Avatar";

export class TargetObjectInstance {
    private _avatar: Avatar;
    private _targetObject: THREE.Object3D;
    private _wantsToInteract = false;

    constructor(avatar: Avatar) {
        this._avatar = avatar;
    }

    public update(timeStep: number): void {
        const targetPointWorldPos = new THREE.Vector3();
        this._targetObject.getWorldPosition(targetPointWorldPos);
        const viewVector = new THREE.Vector3().subVectors(
            targetPointWorldPos,
            this._avatar.position
        );
        this._avatar.setOrientation(viewVector);

        const heightDifference = viewVector.y;
        viewVector.y = 0;
    }

    //getter,setter
    set targetObject(targetObject: THREE.Object3D) {
		this._targetObject = targetObject;
	}
}

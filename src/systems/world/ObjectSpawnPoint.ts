import * as THREE from 'three';
import * as Utils from '../core/FunctionLibrary';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from './World';
import { Chair } from '../objects/Chair';
import { Clothing } from '../objects/Clothing';
import { LoadingManager } from '../core/LoadingManager';

export class ObjectSpawnPoint implements ISpawnPoint {
	private _type: string;

	private _object: THREE.Object3D;

	constructor(object: THREE.Object3D) {
		this._object = object;
	}

	public spawn(loadingManager: LoadingManager, world: World): void {
		loadingManager.loadGLTF('/assets/' + this._type + '.glb', (model: any) => {
			const object: Chair | Clothing = this.getNewChairByType(
				model,
				this._type,
				this._object,
			);
			object.spawnPoint = this._object;

			const worldPos = new THREE.Vector3();
			const worldQuat = new THREE.Quaternion();
			this._object.getWorldPosition(worldPos);
			this._object.getWorldQuaternion(worldQuat);

			object.setPosition(worldPos.x, worldPos.y, worldPos.z);
			object.collision.quaternion.copy(Utils.cannonQuat(worldQuat));
			world.add(object);
		});
	}

	private getNewChairByType(
		model: any,
		type: string,
		object: THREE.Object3D,
	): Chair | Clothing {
		switch (type) {
			case 'chair':
				return new Chair(model, object);
			case 'clothing':
				return new Clothing(model, object);
		}
	}

	get type(): string {
		return this._type;
	}

	set type(type: string) {
		this._type = type;
	}
}

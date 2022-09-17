import * as THREE from 'three';
import * as Utils from '../core/FunctionLibrary';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from './World';
import { Chair } from '../objects/Chair';
import { LoadingManager } from '../core/LoadingManager';

export class ObjectSpawnPoint implements ISpawnPoint {
	private type: string;

	private object: THREE.Object3D;

	constructor(object: THREE.Object3D) {
		this.object = object;
	}

	public spawn(loadingManager: LoadingManager, world: World): void {
		loadingManager.loadGLTF('/assets/' + this.type + '.glb', (model: any) => {
			const object: Chair = this.getNewChairByType(
				model,
				this.type,
				this.object,
			);
			object.setSpawnPoint(this.object);

			const worldPos = new THREE.Vector3();
			const worldQuat = new THREE.Quaternion();
			this.object.getWorldPosition(worldPos);
			this.object.getWorldQuaternion(worldQuat);

			object.setPosition(worldPos.x, worldPos.y, worldPos.z);
			object.getCollision().quaternion.copy(Utils.cannonQuat(worldQuat));
			world.add(object);
		});
	}

	private getNewChairByType(
		model: any,
		type: string,
		object: THREE.Object3D,
	): Chair {
		switch (type) {
			case 'chair':
				return new Chair(model, object);
		}
	}

	public getType(): string {
		return this.type;
	}

	public setType(type: string) {
		this.type = type;
	}
}

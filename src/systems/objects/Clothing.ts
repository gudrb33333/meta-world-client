import * as THREE from 'three';
import * as CANNON from 'cannon';
import { EntityType } from '../enums/EntityType';
import { CollisionGroups } from '../enums/CollisionGroups';
import { WorldObject } from './WorldObject';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export class Clothing extends WorldObject {
	public entityType: EntityType = EntityType.Clothing;
	private _targetPoint: THREE.Object3D;

	constructor(gltf: GLTF, object: THREE.Object3D) {
		super(gltf, object);

		// Read GLTF
		this.readGltfData(gltf);
	}

	public readGltfData(gltf: GLTF) {
		gltf.scene.traverse((child) => {
			if (child.hasOwnProperty('userData')) {
				if (child.userData.data === 'collision') {
					if (child.userData.shape === 'box') {
						child.visible = false;

						const phys = new CANNON.Box(
							new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z),
						);
						phys.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
						this.collision.addShape(
							phys,
							new CANNON.Vec3(
								child.position.x,
								child.position.y,
								child.position.z,
							),
						);
					}
				}
			}
		});

		this._targetPoint = this;

		if (this.collision.shapes.length === 0) {
			console.warn('Clothing ' + typeof this + ' has no collision data.');
		}
	}

	//getter,setter
	get targetPoint(): THREE.Object3D {
		return this._targetPoint;
	}
}

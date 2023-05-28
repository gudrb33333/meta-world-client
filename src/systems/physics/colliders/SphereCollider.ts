import * as CANNON from 'cannon';
import * as THREE from 'three';
import * as Utils from '../../core/FunctionLibrary';
import { ICollider } from '../../interfaces/ICollider';

interface SphereColliderOptions {
	mass?: number;
	position?: CANNON.Vec3;
	radius?: number;
	friction?: number;
}

export class SphereCollider implements ICollider {
	public options: SphereColliderOptions;
	public body: CANNON.Body;
	public debugModel: THREE.Mesh;

	constructor(options: SphereColliderOptions) {
		const defaults: SphereColliderOptions = {
			mass: 0,
			position: new CANNON.Vec3(),
			radius: 0.3,
			friction: 0.3,
		};
		options = Utils.setDefaults(options, defaults);
		this.options = options;

		const mat = new CANNON.Material('sphereMat');
		mat.friction = options.friction;

		const shape = new CANNON.Sphere(options.radius);
		// shape.material = mat;

		// Add phys sphere
		const physSphere = new CANNON.Body({
			mass: options.mass,
			position: options.position,
			shape,
		});
		physSphere.material = mat;

		this.body = physSphere;
	}
}

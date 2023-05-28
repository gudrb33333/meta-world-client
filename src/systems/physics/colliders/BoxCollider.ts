import * as CANNON from 'cannon';
import * as THREE from 'three';
import * as Utils from '../../core/FunctionLibrary';
import { ICollider } from '../../interfaces/ICollider';

interface BoxColliderOptions {
	mass?: number;
	position?: THREE.Vector3;
	size?: THREE.Vector3;
	friction?: number;
}

export class BoxCollider implements ICollider {
	public options: BoxColliderOptions;
	public body: CANNON.Body;
	public debugModel: THREE.Mesh;

	constructor(options: BoxColliderOptions) {
		const defaults: BoxColliderOptions = {
			mass: 0,
			position: new THREE.Vector3(),
			size: new THREE.Vector3(0.3, 0.3, 0.3),
			friction: 0.3,
		};
		options = Utils.setDefaults(options, defaults);
		this.options = options;

		const position = new CANNON.Vec3(
			options.position.x,
			options.position.y,
			options.position.z,
		);
		const size = new CANNON.Vec3(
			options.size.x,
			options.size.y,
			options.size.z,
		);

		const mat = new CANNON.Material('boxMat');
		mat.friction = options.friction;
		// mat.restitution = 0.7;

		const shape = new CANNON.Box(size);
		// shape.material = mat;

		// Add phys sphere
		const physBox = new CANNON.Body({
			mass: options.mass,
			position: position,
			shape,
		});

		physBox.material = mat;

		this.body = physBox;
	}
}

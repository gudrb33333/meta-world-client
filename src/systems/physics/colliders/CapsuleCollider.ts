import * as CANNON from 'cannon';
import * as Utils from '../../core/FunctionLibrary';
import { ICollider } from '../../interfaces/ICollider';

interface CapsuleColliderOptions {
	mass?: number;
	position?: CANNON.Vec3;
	height?: number;
	radius?: number;
	segments?: number;
	friction?: number;
	avatarAdjustValue?: number;
}

export class CapsuleCollider implements ICollider {
	public options: CapsuleColliderOptions;
	public body: CANNON.Body;
	// public visual: THREE.Mesh;

	constructor(options: CapsuleColliderOptions) {
		const defaults: CapsuleColliderOptions = {
			mass: 0,
			position: new CANNON.Vec3(),
			height: 0.5,
			radius: 0.3,
			segments: 8,
			friction: 0.3,
			avatarAdjustValue: 1,
		};
		options = Utils.setDefaults(options, defaults);
		this.options = options;

		const mat = new CANNON.Material('capsuleMat');
		mat.friction = options.friction;

		const capsuleBody = new CANNON.Body({
			mass: options.mass,
			position: options.position,
		});

		// Compound shape
		const sphereShape = new CANNON.Sphere(options.radius);

		// Materials
		capsuleBody.material = mat;
		// sphereShape.material = mat;

		capsuleBody.addShape(
			sphereShape,
			new CANNON.Vec3(0, 0.4 * options.avatarAdjustValue, 0),
		);
		capsuleBody.addShape(
			sphereShape,
			new CANNON.Vec3(
				0,
				options.height / 2 + 0.4 * options.avatarAdjustValue,
				0,
			),
		);
		capsuleBody.addShape(
			sphereShape,
			new CANNON.Vec3(
				0,
				-options.height / 2 + 0.4 * options.avatarAdjustValue,
				0,
			),
		);

		this.body = capsuleBody;
	}
}

import * as THREE from 'three';
import * as Utils from '../../../core/FunctionLibrary';
import { AvatarStateBase } from '../_stateLibrary';
import { Avatar } from '../../Avatar';
import { Chair } from 'src/systems/objects/Chair';

export abstract class ExitingStateBase extends AvatarStateBase {
	protected chair: Chair;
	protected startPosition: THREE.Vector3 = new THREE.Vector3();
	protected endPosition: THREE.Vector3 = new THREE.Vector3();
	protected startRotation: THREE.Quaternion = new THREE.Quaternion();
	protected endRotation: THREE.Quaternion = new THREE.Quaternion();
	protected exitPoint: THREE.Object3D;
	protected dummyObj: THREE.Object3D;

	constructor(avatar: Avatar, chair: Chair) {
		super(avatar);

		this.canFindChairsToEnter = false;
		this.chair = chair;

		this.startPosition.copy(this.avatar.position);
		this.startRotation.copy(this.avatar.quaternion);

		this.dummyObj = new THREE.Object3D();
	}

	public detachAvatarFromChair(): void {
		this.avatar.controlledObject = undefined;
		this.avatar.resetOrientation();
		this.avatar.world.getGraphicsWorld().attach(this.avatar);
		this.avatar.resetVelocity();
		this.avatar.setPhysicsEnabled(true);
		this.avatar.inputReceiverUpdate(0);
		this.avatar.avatarCapsule.body.velocity.copy(
			(this.chair as unknown as Chair).rayCastVehicle.chassisBody.velocity,
		);
		this.avatar.feetRaycast();
	}

	public updateEndRotation(): void {
		const forward = Utils.getForward(this.exitPoint);
		forward.y = 0;
		forward.normalize();

		this.avatar.world.getGraphicsWorld().attach(this.dummyObj);
		this.exitPoint.getWorldPosition(this.dummyObj.position);
		const target = this.dummyObj.position.clone().add(forward);
		this.dummyObj.lookAt(target);
		this.chair.seatPointObject.parent.attach(this.dummyObj);
		this.endRotation.copy(this.dummyObj.quaternion);
	}
}

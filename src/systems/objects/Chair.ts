import { Avatar } from '../avatars/Avatar';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { World } from '../world/World';
import _ = require('lodash');
import { KeyBinding } from '../core/KeyBinding';
import * as Utils from '../core/FunctionLibrary';
import { CollisionGroups } from '../enums/CollisionGroups';
import { EntityType } from '../enums/EntityType';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { IControllable } from '../interfaces/IControllable';

export class Chair
	extends THREE.Object3D
	implements IWorldEntity, IControllable
{
	public updateOrder = 2;
	public entityType: EntityType;
	public controllingAvatar: Avatar;
	public actions: { [action: string]: KeyBinding } = {};

	private rayCastVehicle: CANNON.RaycastVehicle;
	private world: World;
	private collision: CANNON.Body;
	private materials: THREE.Material[] = [];
	private spawnPoint: THREE.Object3D;
	private modelContainer: THREE.Group;

	//public vehicle: IControllable;
	private seatPointObject: THREE.Object3D;

	// String of names of connected seats
	private connectedSeatsString: string;
	// Actual seatPoint objects, need to be identified
	// by parsing connectedSeatsString *after* all seats are imported

	private entryPoints: THREE.Object3D;
	private occupiedBy: Avatar = null;

	constructor(gltf: any, object: THREE.Object3D) {
		super();

		// Physics mat
		const mat = new CANNON.Material('Mat');
		mat.friction = 0.01;

		// Collision body
		this.collision = new CANNON.Body({ mass: 0 });
		this.collision.material = mat;

		// Read GLTF
		this.readChairData(gltf);

		this.modelContainer = new THREE.Group();
		this.add(this.modelContainer);
		this.modelContainer.add(gltf.scene);
		// this.setModel(gltf.scene);

		// Raycast vehicle component
		this.rayCastVehicle = new CANNON.RaycastVehicle({
			chassisBody: this.collision,
			indexUpAxis: 0,
			indexRightAxis: 0,
			indexForwardAxis: 0,
		});

		const worldPos = new THREE.Vector3();
		const worldQuat = new THREE.Quaternion();
		object.getWorldPosition(worldPos);
		object.getWorldQuaternion(worldQuat);

		this.position.set(worldPos.x, worldPos.y, worldPos.z);

		this.quaternion.set(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
	}

	public noDirectionPressed(): boolean {
		return true;
	}

	public update(timeStep: number): void {}

	public allowSleep(value: boolean): void {
		this.collision.allowSleep = value;

		if (value === false) {
			this.collision.wakeUp();
		}
	}

	public handleKeyboardEvent(
		event: KeyboardEvent,
		code: string,
		pressed: boolean,
	): void {
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				const binding = this.actions[action];
				if (_.includes(binding.eventCodes, code)) {
					//this.triggerAction(action, pressed);
				}
			}
		}
	}

	public handleMouseButton(
		event: MouseEvent,
		code: string,
		pressed: boolean,
	): void {
		return;
	}

	public handleMouseMove(
		event: MouseEvent,
		deltaX: number,
		deltaY: number,
	): void {
		this.world.getCameraOperator().move(deltaX, deltaY);
	}

	public handleMouseWheel(event: WheelEvent, value: number): void {
		//this.world.scrollTheTimeScale(value);
	}

	public inputReceiverInit(): void {
		this.collision.allowSleep = false;
	}

	public inputReceiverUpdate(timeStep: number): void {
		// Position camera
		this.world.getCameraOperator().target.set(
			this.position.x,
			this.position.y + 5.5,
			this.position.z,
		);
	}

	public setPosition(x: number, y: number, z: number): void {
		this.collision.position.x = x;
		this.collision.position.y = y;
		this.collision.position.z = z;
	}

	public addToWorld(world: World): void {
		const chairs = world.getChairs();
		if (_.includes(chairs, this)) {
			console.warn('Adding avatar to a world in which it already exists.');
		} else if (this.rayCastVehicle === undefined) {
			console.error('Trying to create chair without raycastChairComponent');
		} else {
			this.world = world;
			chairs.push(this);
			world.getGraphicsWorld().add(this);
			this.rayCastVehicle.addToWorld(world.getPhysicsWorld());

			this.materials.forEach((mat) => {
				world.getSky().csm.setupMaterial(mat);
			});
		}
	}

	public removeFromWorld(world: World): void {
		const chairs = world.getChairs();
		if (!_.includes(chairs, this)) {
			console.warn("Removing avatar from a world in which it isn't present.");
		} else {
			this.world = undefined;
			_.pull(chairs, this);
			world.getGraphicsWorld().remove(this);
			this.rayCastVehicle.removeFromWorld(world.getPhysicsWorld());
		}
	}

	public readChairData(gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				Utils.setupMeshProperties(child);

				if (child.material !== undefined) {
					this.materials.push(child.material);
				}
			}

			if (child.hasOwnProperty('userData')) {
				if (child.userData.hasOwnProperty('data')) {
					if (child.userData.data === 'seat') {
						this.seatPointObject = child;
					}
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
						} else if (child.userData.shape === 'sphere') {
							child.visible = false;

							const phys = new CANNON.Sphere(child.scale.x);
							phys.collisionFilterGroup = CollisionGroups.TrimeshColliders;
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
					if (child.userData.hasOwnProperty('entry_points')) {
						this.entryPoints = gltf.scene.getObjectByName(
							child.userData.entry_points,
						);
					}

					if (child.userData.hasOwnProperty('seat_type')) {
						this.type = child.userData.seat_type;
					}
				}
			}
		});

		if (this.collision.shapes.length === 0) {
			console.warn('Chair ' + typeof this + ' has no collision data.');
		}
	}

	public getSpawnPoint(): THREE.Object3D{
		return this.spawnPoint;
	}

	public setSpawnPoint(spawnPoint: THREE.Object3D){
		this.spawnPoint = spawnPoint;
	}

	public getCollision(): CANNON.Body{
		return this.collision;
	}

	public getEntryPoints(): THREE.Object3D{
		return this.entryPoints;
	}

	public getRayCastVehicle(): CANNON.RaycastVehicle{
		return this.rayCastVehicle;
	}

	public getSeatPointObject(): THREE.Object3D{
		return this.seatPointObject;
	}

	public getOccupiedBy(): Avatar{
		return this.occupiedBy;
	}

	public setOccupiedBy(avatar: Avatar){
		this.occupiedBy = avatar;
	}
}

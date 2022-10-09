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
	public actions: { [action: string]: KeyBinding } = {};
	public controllingAvatar: Avatar;
	private _rayCastVehicle: CANNON.RaycastVehicle;
	private _world: World;
	private _collision: CANNON.Body;
	private _materials: THREE.Material[] = [];
	private _spawnPoint: THREE.Object3D;
	private _modelContainer: THREE.Group;

	//public vehicle: IControllable;
	private _seatPointObject: THREE.Object3D;

	// String of names of connected seats
	private _connectedSeatsString: string;
	// Actual seatPoint objects, need to be identified
	// by parsing connectedSeatsString *after* all seats are imported

	private _entryPoints: THREE.Object3D;
	private _occupiedBy: Avatar = null;

	constructor(gltf: any, object: THREE.Object3D) {
		super();

		// Physics mat
		const mat = new CANNON.Material('Mat');
		mat.friction = 0.01;

		// Collision body
		this._collision = new CANNON.Body({ mass: 0 });
		this._collision.material = mat;

		// Read GLTF
		this.readChairData(gltf);

		this._modelContainer = new THREE.Group();
		this.add(this._modelContainer);
		this._modelContainer.add(gltf.scene);
		// this._setModel(gltf.scene);

		// Raycast vehicle component
		this._rayCastVehicle = new CANNON.RaycastVehicle({
			chassisBody: this._collision,
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
		this._collision.allowSleep = value;

		if (value === false) {
			this._collision.wakeUp();
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
					//this._triggerAction(action, pressed);
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
		this._world.cameraOperator.move(deltaX, deltaY);
	}

	public handleMouseWheel(event: WheelEvent, value: number): void {
		//this._world.scrollTheTimeScale(value);
	}

	public inputReceiverInit(): void {
		this._collision.allowSleep = false;
	}

	public inputReceiverUpdate(timeStep: number): void {
		// Position camera
		this._world
			.cameraOperator
			.getTarget()
			.set(this.position.x, this.position.y + 5.5, this.position.z);
	}

	public setPosition(x: number, y: number, z: number): void {
		this._collision.position.x = x;
		this._collision.position.y = y;
		this._collision.position.z = z;
	}

	public addToWorld(world: World): void {
		const chairs = world.chairs;
		if (_.includes(chairs, this)) {
			console.warn('Adding avatar to a world in which it already exists.');
		} else if (this._rayCastVehicle === undefined) {
			console.error('Trying to create chair without raycastChairComponent');
		} else {
			this._world = world;
			chairs.push(this);
			world.graphicsWorld.add(this);
			this._rayCastVehicle.addToWorld(world.physicsWorld);

			// this._materials.forEach((mat) => {
			// 	world.getSky().csm.setupMaterial(mat);
			// });
		}
	}

	public removeFromWorld(world: World): void {
		const chairs = world.chairs;
		if (!_.includes(chairs, this)) {
			console.warn("Removing avatar from a world in which it isn't present.");
		} else {
			this._world = undefined;
			_.pull(chairs, this);
			world.graphicsWorld.remove(this);
			this._rayCastVehicle.removeFromWorld(world.physicsWorld);
		}
	}

	public readChairData(gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				Utils.setupMeshProperties(child);

				if (child.material !== undefined) {
					this._materials.push(child.material);
				}
			}

			if (child.hasOwnProperty('userData')) {
				if (child.userData.hasOwnProperty('data')) {
					if (child.userData.data === 'seat') {
						this._seatPointObject = child;
					}
					if (child.userData.data === 'collision') {
						if (child.userData.shape === 'box') {
							child.visible = false;

							const phys = new CANNON.Box(
								new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z),
							);
							phys.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
							this._collision.addShape(
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
							this._collision.addShape(
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
						this._entryPoints = gltf.scene.getObjectByName(
							child.userData.entry_points,
						);
					}

					if (child.userData.hasOwnProperty('seat_type')) {
						this.type = child.userData.seat_type;
					}
				}
			}
		});

		if (this._collision.shapes.length === 0) {
			console.warn('Chair ' + typeof this + ' has no collision data.');
		}
	}

	//getter,setter
	get spawnPoint(): THREE.Object3D {
		return this._spawnPoint;
	}

	set spawnPoint(spawnPoint: THREE.Object3D) {
		this._spawnPoint = spawnPoint;
	}

	get collision(): CANNON.Body {
		return this._collision;
	}

	get entryPoints(): THREE.Object3D {
		return this._entryPoints;
	}

	get rayCastVehicle(): CANNON.RaycastVehicle {
		return this._rayCastVehicle;
	}

	get seatPointObject(): THREE.Object3D {
		return this._seatPointObject;
	}

	get occupiedBy(): Avatar {
		return this._occupiedBy;
	}

	set occupiedBy(avatar: Avatar) {
		this._occupiedBy = avatar;
	}
}

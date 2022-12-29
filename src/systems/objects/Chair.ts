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
import { SpriteText2D, textAlign } from 'three-text2d';

export class Chair
	extends THREE.Object3D
	implements IWorldEntity, IControllable
{
	public updateOrder = 50;
	public entityType: EntityType = EntityType.Chair;
	public actions: { [action: string]: KeyBinding } = {};
	public controllingAvatar: Avatar;
	private _rayCastVehicle: CANNON.RaycastVehicle;
	private _world: World;
	private _collision: CANNON.Body;
	private _materials: THREE.Material[] = [];
	private _spawnPoint: THREE.Object3D;
	private _modelContainer: THREE.Group;
	private _interactionMark: SpriteText2D;
	private _interactionText: SpriteText2D;

	//public vehicle: IControllable;
	private _seatPointObject: THREE.Object3D;
	private _entryPoints: THREE.Object3D;
	private _occupiedBy: Avatar = null;

	private _isSeated = false;

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

		this._interactionMark = new SpriteText2D('[F]', {
			align: textAlign.center,
			font: '15px Arial',
			fillStyle: '#ffffff',
			antialias: true,
			backgroundColor: '#000000',
		});
		this._interactionMark.scale.set(1 / 100, 1 / 100, 1);
		this._interactionMark.position.y = this._interactionMark.position.y + 1.8;
		this.add(this._interactionMark);
		this._interactionMark.visible = false;

		this._interactionText = new SpriteText2D('상호작용', {
			align: textAlign.center,
			font: '15px Arial',
			fillStyle: '#ffffff',
			antialias: true,
		});
		this._interactionText.scale.set(1 / 100, 1 / 100, 1);
		this._interactionText.position.y = this._interactionText.position.y + 2;
		this.add(this._interactionText);
		this._interactionText.visible = false;
	}

	public noDirectionPressed(): boolean {
		return true;
	}

	public update(timeStep: number): void {
		if (this._world.userAvatar) {
			const distance = this.position.distanceTo(
				this._world.userAvatar.position,
			);
			if (distance < 2) {
				this.visibleInteractionMark();
				this._world.userAvatar.canInteractObjectMap.set(this.uuid, this);
			} else {
				this.unvisibleInteractionMark();
				this._world.userAvatar.canInteractObjectMap.delete(this.uuid);
			}
		}
	}

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
		this._world.cameraOperator
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

	private visibleInteractionMark() {
		if (!this._interactionMark.visible && !this._interactionMark.visible) {
			this._interactionMark.visible = true;
			this._interactionText.visible = true;
		}
	}

	private unvisibleInteractionMark() {
		this._interactionMark.visible = false;
		this._interactionText.visible = false;
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

	set isSeated(isSeated: boolean) {
		this._isSeated = isSeated;
	}

	get isSeated(): boolean {
		return this._isSeated;
	}
}

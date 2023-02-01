import { Avatar } from '../avatars/Avatar';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import _ = require('lodash');
import { KeyBinding } from '../core/KeyBinding';
import * as Utils from '../core/FunctionLibrary';
import { CollisionGroups } from '../enums/CollisionGroups';
import { EntityType } from '../enums/EntityType';
import { IControllable } from '../interfaces/IControllable';
import { WorldObject } from './WorldObject';

export class Chair
	extends WorldObject
	implements IControllable
{
	public entityType: EntityType = EntityType.Chair;
	public actions: { [action: string]: KeyBinding } = {};
	public controllingAvatar: Avatar;

	private _materials: THREE.Material[] = [];

	//public vehicle: IControllable;
	private _seatPointObject: THREE.Object3D;
	private _entryPoints: THREE.Object3D;
	private _occupiedBy: Avatar = null;

	constructor(gltf: any, object: THREE.Object3D) {
		super(gltf, object);

		// Read GLTF
		this.readGltfData(gltf);
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
		this.world.cameraOperator.move(deltaX, deltaY);
	}

	public handleMouseWheel(event: WheelEvent, value: number): void {
		//this._world.scrollTheTimeScale(value);
	}

	public inputReceiverUpdate(timeStep: number): void {
		// Position camera
		this.world.cameraOperator
			.getTarget()
			.set(this.position.x, this.position.y + 5.5, this.position.z);
	}

	public readGltfData(gltf: any): void {
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

		if (this.collision.shapes.length === 0) {
			console.warn('Chair ' + typeof this + ' has no collision data.');
		}
	}

	get entryPoints(): THREE.Object3D {
		return this._entryPoints;
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

import * as THREE from 'three';
import * as CANNON from 'cannon';
import { EntityType } from '../enums/EntityType';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { World } from '../world/World';
import _ = require('lodash');
import { SpriteText2D, textAlign } from 'three-text2d';

export abstract class WorldObject extends THREE.Object3D implements IWorldEntity {
    public abstract entityType: EntityType;
    public updateOrder: number = 11;
    public world: World;
    public spawnPoint: THREE.Object3D;
    public collision: CANNON.Body;
    public rayCastVehicle: CANNON.RaycastVehicle;
    private _modelContainer: THREE.Group;
	private _interactionMark: SpriteText2D;
	private _interactionText: SpriteText2D;

    public _isSeated = false;

    constructor(gltf: any, object:THREE.Object3D) {
        super();
        // Physics mat
		const mat = new CANNON.Material('Mat');
		mat.friction = 0.01;

		// Collision body
		this.collision = new CANNON.Body({ mass: 0 });
		this.collision.material = mat;

        		// Raycast vehicle component
		this.rayCastVehicle = new CANNON.RaycastVehicle({
			chassisBody: this.collision,
			indexUpAxis: 0,
			indexRightAxis: 0,
			indexForwardAxis: 0,
		});

        this._modelContainer = new THREE.Group();
		this.add(this._modelContainer);
		this._modelContainer.add(gltf.scene);
		// this._setModel(gltf.scene);

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

	public abstract readGltfData(gltf:any): void;

	public removeFromWorld(world: World): void {
		const chairs = world.worldObjects;
		if (!_.includes(chairs, this)) {
			console.warn("Removing avatar from a world in which it isn't present.");
		} else {
			this.world = undefined;
			_.pull(chairs, this);
			world.graphicsWorld.remove(this);
			this.rayCastVehicle.removeFromWorld(world.physicsWorld);
		}
	}

	public update(timeStep: number): void {
		if (this.world.userAvatar) {
			const distance = this.position.distanceTo(
				this.world.userAvatar.position,
			);
			if (distance < 2) {
				this.visibleInteractionMark();
				this.world.userAvatar.canInteractObjectMap.set(this.uuid, this);
			} else {
				this.unvisibleInteractionMark();
				this.world.userAvatar.canInteractObjectMap.delete(this.uuid);
			}
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


    public allowSleep(value: boolean): void {
		this.collision.allowSleep = value;

		if (value === false) {
			this.collision.wakeUp();
		}
	}

    public inputReceiverInit(): void {
		this.collision.allowSleep = false;
	}

	public noDirectionPressed(): boolean {
		return true;
	}

    public setPosition(x: number, y: number, z: number): void {
		this.collision.position.x = x;
		this.collision.position.y = y;
		this.collision.position.z = z;
	}

    public addToWorld(world: World): void {
		const chairs = world.worldObjects;
		if (_.includes(chairs, this)) {
			console.warn('Adding avatar to a world in which it already exists.');
		} else if (this.rayCastVehicle === undefined) {
			console.error('Trying to create chair without raycastChairComponent');
		} else {
			this.world = world;
			chairs.push(this);
			world.graphicsWorld.add(this);
			this.rayCastVehicle.addToWorld(world.physicsWorld);

			// this._materials.forEach((mat) => {
			// 	world.getSky().csm.setupMaterial(mat);
			// });
		}
	}

    set isSeated(isSeated: boolean) {
		this._isSeated = isSeated;
	}

	get isSeated(): boolean {
		return this._isSeated;
	}
}
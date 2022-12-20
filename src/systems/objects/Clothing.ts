import * as THREE from 'three';
import * as CANNON from 'cannon';
import { EntityType } from "../enums/EntityType";
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { World } from "../world/World";
import * as _ from 'lodash';
import { CollisionGroups } from '../enums/CollisionGroups';
import { SpriteText2D, textAlign } from 'three-text2d';

export class Clothing extends THREE.Object3D implements IWorldEntity{

    public updateOrder: number = 51;
    public entityType: EntityType;
    private _spawnPoint: THREE.Object3D;
    private _collision: CANNON.Body;
    private _world: World;
    private _rayCastVehicle: CANNON.RaycastVehicle;
    private _targetPoint: THREE.Object3D;
    private _interactionMark: SpriteText2D;
    private _interactionText: SpriteText2D;

    constructor(gltf: any, object: THREE.Object3D) {
        super();

        // Physics mat
		const mat = new CANNON.Material('Mat');
		mat.friction = 0.01;

        // Collision body
		this._collision = new CANNON.Body({ mass: 0 });
		this._collision.material = mat;

        // Read GLTF
		this.readClothingData(gltf);

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
            backgroundColor: '#000000'
		});
		this._interactionMark.scale.set(1/100, 1/100, 1);
        this._interactionMark.position.y = this._interactionMark.position.y + 1.8
		this.add(this._interactionMark);
        this._interactionMark.visible = false;

        this._interactionText = new SpriteText2D('상호작용', {
			align: textAlign.center,
			font: '15px Arial',
			fillStyle: '#ffffff',
			antialias: true,
		});
		this._interactionText.scale.set(1/100, 1/100, 1);
        this._interactionText.position.y = this._interactionText.position.y + 2
		this.add(this._interactionText);
        this._interactionText.visible = false;
    }

	public setPosition(x: number, y: number, z: number): void {
		this._collision.position.x = x;
		this._collision.position.y = y;
		this._collision.position.z = z;
	}

    public addToWorld(world: World): void {
        const clothing = world.clothing;
		if (_.includes(clothing, this)) {
			console.warn('Adding avatar to a world in which it already exists.');
		} else {
			this._world = world;
			clothing.push(this);
			world.graphicsWorld.add(this);
            this._rayCastVehicle.addToWorld(world.physicsWorld);

			// this._materials.forEach((mat) => {
			// 	world.getSky().csm.setupMaterial(mat);
			// });
		}
    }
    public removeFromWorld(world: World): void {
        throw new Error("Method not implemented.");
    }

    public update(timestep: number): void {
        if(this._world.userAvatar){
           const distance = this.position.distanceTo(this._world.userAvatar.position);
           if(distance < 2){
            this.visibleInteractionMark();
            this._world.userAvatar.canInteractMap.set(this.uuid, this)
           } else {
            this.unvisibleInteractionMark();
            this._world.userAvatar.canInteractMap.delete(this.uuid)
           }
        }

        // const distance = this.position.distanceTo(this._world.userAvatar.position)
        // console.log(distance);
    }

    private readClothingData(gltf: any) {
        gltf.scene.traverse((child) => {
            if(child.hasOwnProperty('userData')) {
                if(child.userData.data === 'collision') {
                    if(child.userData.shape === 'box') {
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
                    } 
                }
            }
        });

        this._targetPoint = this;

        if (this._collision.shapes.length === 0) {
			console.warn('Clothing ' + typeof this + ' has no collision data.');
		}
    }

    private visibleInteractionMark () {
        if(!this._interactionMark.visible && !this._interactionMark.visible){
            this._interactionMark.visible = true;
            this._interactionText.visible = true;
        }
	}

    private unvisibleInteractionMark () {
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

    get targetPoint(): THREE.Object3D {
		return this._targetPoint;
	}
}

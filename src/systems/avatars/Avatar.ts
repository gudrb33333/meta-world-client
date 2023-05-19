import * as THREE from 'three';
import * as CANNON from 'cannon';
import * as _ from 'lodash';
import * as Utils from '../core/FunctionLibrary';
import { SpriteText2D, textAlign } from 'three-text2d';

import { KeyBinding } from '../core/KeyBinding';
import { VectorSpringSimulator } from '../physics/spring_simulation/VectorSpringSimulator';
import { RelativeSpringSimulator } from '../physics/spring_simulation/RelativeSpringSimulator';
import { Idle } from './avatar_states/Idle';
import { EnteringChair } from './avatar_states/objects/EnteringChair';
import { ExitingChair } from './avatar_states/objects/ExitingChair';
import { World } from '../world/World';
import { IControllable } from '../interfaces/IControllable';
import { IAvatarState } from '../interfaces/IAvatarState';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { Chair } from '../objects/Chair';
import { Clothing } from '../objects/Clothing';
import { CollisionGroups } from '../enums/CollisionGroups';
import { CapsuleCollider } from '../physics/colliders/CapsuleCollider';
import { ChairEntryInstance } from './ChairEntryInstance';
import { GroundImpactData } from './GroundImpactData';
import { ClosestObjectFinder } from '../core/ClosestObjectFinder';
import { Object3D } from 'three';
import { EntityType } from '../enums/EntityType';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { TargetObjectInstance } from './TargetObjectInstance';
import { SidebarCanvas } from '../world/SidebarCanvas';
import { WorldObject } from '../objects/WorldObject';

export class Avatar
	extends THREE.Object3D
	implements IInputReceiver, IWorldEntity
{
	public updateOrder = 1;
	public entityType: EntityType = EntityType.Avatar;
	public actions: { [action: string]: KeyBinding };

	private _height = 0;
	private _tiltContainer: THREE.Group;
	private _modelContainer: THREE.Group;
	private _materials: THREE.Material[] = [];
	private _mixer: THREE.AnimationMixer;
	private _animations: THREE.AnimationClip[];

	// Movement
	private _acceleration: THREE.Vector3 = new THREE.Vector3();
	private _velocity: THREE.Vector3 = new THREE.Vector3();
	private _arcadeVelocityInfluence: THREE.Vector3 = new THREE.Vector3();
	private _velocityTarget: THREE.Vector3 = new THREE.Vector3();
	private _arcadeVelocityIsAdditive = false;

	private _defaultVelocitySimulatorDamping = 0.8;
	private _defaultVelocitySimulatorMass = 50;
	private _velocitySimulator: VectorSpringSimulator;
	private _moveSpeed = 4;
	private _angularVelocity = 0;
	private _orientation: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
	private _orientationTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
	private _defaultRotationSimulatorDamping = 0.5;
	private _defaultRotationSimulatorMass = 10;
	private _rotationSimulator: RelativeSpringSimulator;
	private _viewVector: THREE.Vector3;
	private _avatarCapsule: CapsuleCollider;

	// Ray casting
	private _rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
	private _rayHasHit = false;
	private _rayCastLength = 0.57;
	private _raySafeOffset = 0.06;
	private _wantsToJump = false;
	private _initJumpSpeed = -1;
	private _groundImpactData: GroundImpactData = new GroundImpactData();
	private _raycastBox: THREE.Mesh;

	private _world: World;
	private _avatarState: IAvatarState;

	//chairs
	private _controlledObject: IControllable;
	private _occupyingChair: Chair = null;
	private _chairEntryInstance: ChairEntryInstance = null;

	//clothing
	private _clothingObjectInstance: TargetObjectInstance = null;

	private _sessionId: string;

	private _physicsEnabled = true;

	private _avatarAnimationState: string = null;
	private _displacement: THREE.Vector3;

	private _sidebarCanvas: SidebarCanvas;

	private _canInteractObjectMap: Map<string, WorldObject> = new Map<
		string,
		WorldObject
	>();

	constructor(gltf: GLTF, avatarAdjustValue: number) {
		super();

		this.readAvatarData(gltf);
		this.setAnimations(gltf.animations);

		this._moveSpeed *= avatarAdjustValue;

		// The visuals group is centered for easy avatar tilting
		this._tiltContainer = new THREE.Group();
		this.add(this._tiltContainer);

		// Model container is used to reliably ground the avatar, as animation can alter the position of the model itself
		this._modelContainer = new THREE.Group();
		this._modelContainer.position.y = -0.57;
		this._tiltContainer.add(this._modelContainer);
		this._modelContainer.add(gltf.scene);

		this._mixer = new THREE.AnimationMixer(gltf.scene);

		this._velocitySimulator = new VectorSpringSimulator(
			60,
			this._defaultVelocitySimulatorMass,
			this._defaultVelocitySimulatorDamping,
		);
		this._rotationSimulator = new RelativeSpringSimulator(
			60,
			this._defaultRotationSimulatorMass,
			this._defaultRotationSimulatorDamping,
		);

		this._viewVector = new THREE.Vector3();

		// Actions
		this.actions = {
			up: new KeyBinding('KeyW'),
			down: new KeyBinding('KeyS'),
			left: new KeyBinding('KeyA'),
			right: new KeyBinding('KeyD'),
			run: new KeyBinding('ShiftLeft'),
			jump: new KeyBinding('Space'),
			use: new KeyBinding('KeyE'),
			enter: new KeyBinding('KeyF'),
			enter_passenger: new KeyBinding('KeyP'),
			quit_social_animation: new KeyBinding('Backquote'),
			stand_clap: new KeyBinding('Digit1'),
			stand_wave: new KeyBinding('Digit2'),
			stand_dance: new KeyBinding('Digit3'),
		};


		this.scale.set(avatarAdjustValue, avatarAdjustValue, avatarAdjustValue);

		// Physics
		// Player Capsule
		this._avatarCapsule = new CapsuleCollider({
			mass: 1,
			position: new CANNON.Vec3(),
			height: 1,
			radius: 0.25,
			segments: 8,
			friction: 0.0,
			avatarAdjustValue: avatarAdjustValue
		});
		// capsulePhysics.physical.collisionFilterMask = ~CollisionGroups.Trimesh;
		this._avatarCapsule.body.shapes.forEach((shape) => {
			// tslint:disable-next-line: no-bitwise
			shape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
		});
		this._avatarCapsule.body.allowSleep = false;

		// Move avatar to different collision group for raycasting
		this._avatarCapsule.body.collisionFilterGroup = 2;

		// Disable avatar rotation
		this._avatarCapsule.body.fixedRotation = true;
		this._avatarCapsule.body.updateMassProperties();

		// Ray cast debug
		const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		const boxMat = new THREE.MeshLambertMaterial({
			color: 0xff0000,
		});
		this._raycastBox = new THREE.Mesh(boxGeo, boxMat);
		this._raycastBox.visible = false;

		// Physics pre/post step callback bindings
		this._avatarCapsule.body.preStep = (body: CANNON.Body) => {
			this.physicsPreStep(body, this);
		};
		this._avatarCapsule.body.postStep = (body: CANNON.Body) => {
			this.physicsPostStep(body, this);
		};

		// States
		this.setState(new Idle(this));

		document.addEventListener('toggle-out-event', () => {
			this.triggerAction('up', false);
			this.triggerAction('down', false);
			this.triggerAction('left', false);
			this.triggerAction('right', false);
			this.triggerAction('run', false);
		});
	}

	public setAnimations(animations: THREE.AnimationClip[]): void {
		this._animations = animations;
	}

	public setArcadeVelocityInfluence(
		x: number,
		y: number = x,
		z: number = x,
	): void {
		this._arcadeVelocityInfluence.set(x, y, z);
	}

	public setViewVector(vector: THREE.Vector3): void {
		this._viewVector.copy(vector).normalize();
	}

	public setAvatarName(avatarName: string) {
		const charaterNameText = new SpriteText2D(avatarName, {
			align: textAlign.center,
			font: '20px Arial',
			fillStyle: '#ffffff',
			antialias: true,
		});
		charaterNameText.scale.set(1 / 200, 1 / 200, 1);
		charaterNameText.position.set(
			this.position.x,
			this.position.y + 1.35,
			this.position.z,
		);
		this.add(charaterNameText);
	}

	/**
	 * Set state to the player. Pass state class (function) name.
	 * @param {function} State
	 */
	public setState(state: IAvatarState): void {
		this._avatarState = state;
		this._avatarState.onInputChange();
	}

	public setPosition(x: number, y: number, z: number): void {
		if (this._physicsEnabled) {
			this._avatarCapsule.body.previousPosition = new CANNON.Vec3(x, y, z);
			this._avatarCapsule.body.position = new CANNON.Vec3(x, y, z);
			this._avatarCapsule.body.interpolatedPosition = new CANNON.Vec3(x, y, z);
		} else {
			this.position.x = x;
			this.position.y = y;
			this.position.z = z;
		}
	}

	public resetVelocity(): void {
		this._velocity.x = 0;
		this._velocity.y = 0;
		this._velocity.z = 0;

		this._avatarCapsule.body.velocity.x = 0;
		this._avatarCapsule.body.velocity.y = 0;
		this._avatarCapsule.body.velocity.z = 0;

		this._velocitySimulator.init();
	}

	public setArcadeVelocityTarget(velZ: number, velX = 0, velY = 0): void {
		this._velocityTarget.z = velZ;
		this._velocityTarget.x = velX;
		this._velocityTarget.y = velY;
	}

	public setOrientation(vector: THREE.Vector3, instantly = false): void {
		const lookVector = new THREE.Vector3().copy(vector).setY(0).normalize();
		this._orientationTarget.copy(lookVector);

		if (instantly) {
			this._orientation.copy(lookVector);
		}
	}

	public resetOrientation(): void {
		const forward = Utils.getForward(this);
		this.setOrientation(forward, true);
	}

	public setPhysicsEnabled(value: boolean): void {
		this._physicsEnabled = value;
		const physicsWorld = this._world.physicsWorld;

		if (value === true) {
			physicsWorld.addBody(this._avatarCapsule.body);
		} else {
			physicsWorld.remove(this._avatarCapsule.body);
		}
	}

	public readAvatarData(gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				Utils.setupMeshProperties(child);

				if (child.material !== undefined) {
					this._materials.push(child.material);
				}
			}
		});
	}

	public handleKeyboardEvent(
		event: KeyboardEvent,
		code: string,
		pressed: boolean,
	): void {
		if (this._controlledObject !== undefined) {
			this._controlledObject.handleKeyboardEvent(event, code, pressed);
		} else {
			const cameraOperator = this._world.cameraOperator;
			// Free camera
			if (code === 'KeyC' && pressed === true && event.shiftKey === true) {
				this.resetControls();
				cameraOperator.setAvatarCaller(this);
				this._world.inputManager.setInputReceiver(cameraOperator);
			} else {
				for (const action in this.actions) {
					if (this.actions.hasOwnProperty(action)) {
						const binding = this.actions[action];
						if (_.includes(binding.eventCodes, code)) {
							this.triggerAction(action, pressed);
						}
					}
				}
			}
		}
	}

	public handleLeftJoystickEvent(
		displacement: THREE.Vector3,
		code: string,
		pressed: boolean,
	): void {
		this._displacement = displacement;
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				const binding = this.actions[action];
				if (_.includes(binding.eventCodes, code)) {
					this.triggerAction(action, pressed);
				}
			}
		}
	}

	public handleRightJoystickEvent(
		lookDx: number,
		lookDy: number,
		pressed: boolean,
	): void {
		this._world.cameraOperator.move(lookDx, lookDy);
	}

	public handleMouseButton(
		event: MouseEvent,
		code: string,
		pressed: boolean,
	): void {
		if (this._controlledObject !== undefined) {
			this._controlledObject.handleMouseButton(event, code, pressed);
		} else {
			for (const action in this.actions) {
				if (this.actions.hasOwnProperty(action)) {
					const binding = this.actions[action];

					if (_.includes(binding.eventCodes, code)) {
						this.triggerAction(action, pressed);
					}
				}
			}
		}
	}

	public handleMouseMove(
		event: MouseEvent,
		deltaX: number,
		deltaY: number,
	): void {
		if (this._controlledObject !== undefined) {
			this._controlledObject.handleMouseMove(event, deltaX, deltaY);
		} else {
			this._world.cameraOperator.move(deltaX, deltaY);
		}
	}

	public handleMouseWheel(event: WheelEvent, value: number): void {
		if (this._controlledObject !== undefined) {
			this._controlledObject.handleMouseWheel(event, value);
		} else {
			//this.world.scrollTheTimeScale(value);
		}
	}

	public handleDomElementBlurEvent(event: FocusEvent): void {
		this.triggerAction('up', false);
		this.triggerAction('down', false);
		this.triggerAction('left', false);
		this.triggerAction('right', false);
		this.triggerAction('run', false);
	}

	public triggerAction(actionName: string, value: boolean): void {
		// Get action and set it's parameters
		const action = this.actions[actionName];
		if (action.isPressed !== value) {
			// Set value
			action.isPressed = value;

			// Reset the 'just' attributes
			action.justPressed = false;
			action.justReleased = false;

			// Set the 'just' attributes
			if (value) action.justPressed = true;
			else action.justReleased = true;

			// Tell player to handle states according to new input
			this._avatarState.onInputChange();

			// Reset the 'just' attributes
			action.justPressed = false;
			action.justReleased = false;
		}
	}

	public takeControl(): void {
		if (this._world !== undefined) {
			this._world.inputManager.setInputReceiver(this);
		} else {
			console.warn(
				"Attempting to take control of a avatar that doesn't belong to a world.",
			);
		}
	}

	public resetControls(): void {
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				this.triggerAction(action, false);
			}
		}
	}

	public update(timeStep: number): void {
		this._clothingObjectInstance?.update(timeStep);
		this._chairEntryInstance?.update(timeStep);
		// console.log(this.occupyingSeat);
		this.avatarState?.update(timeStep);

		// this.visuals.position.copy(this.modelOffset);
		if (this._physicsEnabled) this.springMovement(timeStep);
		if (this._physicsEnabled) this.springRotation(timeStep);
		if (this._physicsEnabled) this.rotateModel();
		if (this._mixer !== undefined) this._mixer.update(timeStep);

		// Sync physics/graphics
		if (this._physicsEnabled) {
			this.position.set(
				this._avatarCapsule.body.interpolatedPosition.x,
				this._avatarCapsule.body.interpolatedPosition.y,
				this._avatarCapsule.body.interpolatedPosition.z,
			);
		} else {
			const newPos = new THREE.Vector3();
			this.getWorldPosition(newPos);

			this._avatarCapsule.body.position.copy(Utils.cannonVector(newPos));
			this._avatarCapsule.body.interpolatedPosition.copy(
				Utils.cannonVector(newPos),
			);
		}

		this.updateMatrixWorld();
	}

	public inputReceiverInit(): void {
		if (this._controlledObject !== undefined) {
			this._controlledObject.inputReceiverInit();
			return;
		}
		const cameraOperator = this._world.cameraOperator;
		cameraOperator.setRadius(2, true);
		cameraOperator.setFollowMode(false);
		// this.world.dirLight.target = this;

		//this.displayControls();
	}

	// public displayControls(): void {
	// 	this.world.updateControls([
	// 		{
	// 			keys: ['W', 'A', 'S', 'D'],
	// 			desc: 'Movement',
	// 		},
	// 		{
	// 			keys: ['Shift'],
	// 			desc: 'Sprint',
	// 		},
	// 		{
	// 			keys: ['Space'],
	// 			desc: 'Jump',
	// 		},
	// 		{
	// 			keys: ['F', 'or', 'G'],
	// 			desc: 'Enter chair',
	// 		},
	// 		{
	// 			keys: ['Shift', '+', 'R'],
	// 			desc: 'Respawn',
	// 		},
	// 		{
	// 			keys: ['Shift', '+', 'C'],
	// 			desc: 'Free camera',
	// 		},
	// 	]);
	// }

	public inputReceiverUpdate(timeStep: number): void {
		if (this._controlledObject !== undefined) {
			this._controlledObject.inputReceiverUpdate(timeStep);
		} else {
			// Look in camera's direction
			this._viewVector = new THREE.Vector3().subVectors(
				this.position,
				this._world.camera.position,
			);
			this.getWorldPosition(this._world.cameraOperator.getTarget());
		}
	}

	public setAvatarAnimationState(clipName: string): void {
		this._avatarAnimationState = clipName;
	}

	public setAnimation(clipName: string, fadeIn: number): number {
		if (this._mixer !== undefined) {
			// gltf
			const clip = THREE.AnimationClip.findByName(this._animations, clipName);

			this.setAvatarAnimationState(clipName);

			const action = this._mixer.clipAction(clip);
			if (action === null) {
				console.error(`Animation ${clipName} not found!`);
				return 0;
			}

			this._mixer.stopAllAction();
			action.fadeIn(fadeIn);
			action.play();

			return action.getClip().duration;
		}
	}

	public setOtherAvatarAnimation(clipName: string, fadeIn: number): number {
		if (this._mixer !== undefined) {
			// gltf
			const clip = THREE.AnimationClip.findByName(this._animations, clipName);

			const action: THREE.AnimationAction = this._mixer.clipAction(clip);
			if (action === null) {
				console.error(`Animation ${clipName} not found!`);
				return 0;
			}
			//console.log(clipName)
			//console.log(action.isRunning())
			if (!action.isRunning()) {
				this._mixer.stopAllAction();
				action.fadeIn(fadeIn);
				action.play();
			}
			return action.getClip().duration;
		}
	}

	public springMovement(timeStep: number): void {
		// Simulator
		this._velocitySimulator.target.copy(this._velocityTarget);
		this._velocitySimulator.simulate(timeStep);

		// Update values
		this._velocity.copy(this._velocitySimulator.position);
		this._acceleration.copy(this._velocitySimulator.velocity);
	}

	public springRotation(timeStep: number): void {
		// Spring rotation
		// Figure out angle between current and target orientation
		const angle = Utils.getSignedAngleBetweenVectors(
			this._orientation,
			this._orientationTarget,
		);

		// Simulator
		this._rotationSimulator.target = angle;
		this._rotationSimulator.simulate(timeStep);
		const rot = this._rotationSimulator.position;

		// Updating values
		this._orientation.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
		this._angularVelocity = this._rotationSimulator.velocity;
	}

	public getLocalMovementDirection(): THREE.Vector3 {
		if (this._displacement !== undefined) {
			return this._displacement.normalize();
		} else {
			const positiveX = this.actions.right.isPressed ? -1 : 0;
			const negativeX = this.actions.left.isPressed ? 1 : 0;
			const positiveZ = this.actions.up.isPressed ? 1 : 0;
			const negativeZ = this.actions.down.isPressed ? -1 : 0;

			return new THREE.Vector3(
				positiveX + negativeX,
				0,
				positiveZ + negativeZ,
			).normalize();
		}
	}

	public getCameraRelativeMovementVector(): THREE.Vector3 {
		const localDirection = this.getLocalMovementDirection();
		const flatViewVector = new THREE.Vector3(
			this._viewVector.x,
			0,
			this._viewVector.z,
		).normalize();

		return Utils.appplyVectorMatrixXZ(flatViewVector, localDirection);
	}

	public setCameraRelativeOrientationTarget(): void {
		if (this._chairEntryInstance === null) {
			const moveVector = this.getCameraRelativeMovementVector();

			if (moveVector.x === 0 && moveVector.y === 0 && moveVector.z === 0) {
				this.setOrientation(this._orientation);
			} else {
				this.setOrientation(moveVector);
			}
		}
	}

	public rotateModel(): void {
		this.lookAt(
			this.position.x + this._orientation.x,
			this.position.y + this._orientation.y,
			this.position.z + this._orientation.z,
		);
	}

	public jump(initJumpSpeed = -1): void {
		this._wantsToJump = true;
		this._initJumpSpeed = initJumpSpeed;
	}

	public closestObject() {
		let targetObject: Object3D;
		let type: EntityType;
		let closestDistance = 1000000;
		this._canInteractObjectMap.forEach((mapObject) => {
			const tempDistance = this._world.userAvatar.position.distanceTo(
				mapObject.position,
			);
			if (closestDistance > tempDistance) {
				closestDistance = tempDistance;
				targetObject = mapObject;
				type = mapObject.entityType;
			}
		});

		if (targetObject) {
			if (type === EntityType.Chair) {
				this.findChairToEnter(targetObject as Chair);
			} else if (type === EntityType.Clothing) {
				this.findClothing(targetObject as Clothing);
			}
		}
	}

	public findClothing(targetObject: Clothing): void {
		// reusable world position variable
		const worldPos = new THREE.Vector3();

		const targetObjectInstance = new TargetObjectInstance(this);
		targetObjectInstance.targetObject = targetObject;

		const point = targetObject.targetPoint;
		point.getWorldPosition(worldPos);
		this._clothingObjectInstance = targetObjectInstance;
		this._sidebarCanvas = SidebarCanvas.getInstance();
		const openToggle = new CustomEvent('sidebar-toggle-open-event', {
			detail: {
				sidebarCanvas: this._sidebarCanvas,
				name: targetObject.spawnPoint.name,
			},
		});

		document.dispatchEvent(openToggle);
		this.avatarState.canFindCloting = false;
		document.exitPointerLock();
	}

	public findChairToEnter(targetObject: Chair): void {
		// reusable world position variable
		const worldPos = new THREE.Vector3();

		// Find best chair
		const chair = targetObject;
		const chairEntryInstance = new ChairEntryInstance(this);

		chair.seatPointObject.getWorldPosition(worldPos);

		const targetChair = targetObject;
		chairEntryInstance.targetChair = targetChair;

		const entryPointFinder = new ClosestObjectFinder<Object3D>(this.position);

		const point = targetChair.entryPoints;
		point.getWorldPosition(worldPos);
		entryPointFinder.consider(point, worldPos);

		if (entryPointFinder.closestObject !== undefined) {
			chairEntryInstance.entryPoint = entryPointFinder.closestObject;
			this.triggerAction('up', true);
			this._chairEntryInstance = chairEntryInstance;
		}
	}

	public enterChair(chair: Chair, entryPoint: THREE.Object3D): void {
		this.resetControls();
		this.setState(new EnteringChair(this, chair, entryPoint));
	}

	public transferControls(entity: IControllable): void {
		// Currently running through all actions of this avatar and the chair,
		// comparing keycodes of actions and based on that triggering chair's actions
		// Maybe we should ask input manager what's the current state of the keyboard
		// and read those values... TODO
		for (const action1 in this.actions) {
			if (this.actions.hasOwnProperty(action1)) {
				for (const action2 in entity.actions) {
					if (entity.actions.hasOwnProperty(action2)) {
						const a1 = this.actions[action1];
						const a2 = entity.actions[action2];

						a1.eventCodes.forEach((code1) => {
							a2.eventCodes.forEach((code2) => {
								if (code1 === code2) {
									//entity.triggerAction(action2, a1.isPressed);
								}
							});
						});
					}
				}
			}
		}
	}

	public exitChair(): void {
		if (this._occupyingChair !== null) {
			this.setState(new ExitingChair(this, this._occupyingChair));
		}
	}

	public occupySeat(chair: Chair): void {
		this._occupyingChair = chair;
		chair.occupiedBy = this;
	}

	public leaveSeat(): void {
		if (this._occupyingChair !== null) {
			this._occupyingChair.occupiedBy = null;
		}
	}

	public physicsPreStep(body: CANNON.Body, avatar: Avatar): void {
		avatar.feetRaycast();

		// Raycast debug
		if (avatar._rayHasHit) {
			if (avatar._raycastBox.visible) {
				avatar._raycastBox.position.x = avatar._rayResult.hitPointWorld.x;
				avatar._raycastBox.position.y = avatar._rayResult.hitPointWorld.y;
				avatar._raycastBox.position.z = avatar._rayResult.hitPointWorld.z;
			}
		} else {
			if (avatar._raycastBox.visible) {
				avatar._raycastBox.position.set(
					body.position.x,
					body.position.y - avatar._rayCastLength - avatar._raySafeOffset,
					body.position.z,
				);
			}
		}
	}

	public feetRaycast(): void {
		// Player ray casting
		// Create ray
		const body = this._avatarCapsule.body;
		const start = new CANNON.Vec3(
			body.position.x,
			body.position.y,
			body.position.z,
		);
		const end = new CANNON.Vec3(
			body.position.x,
			body.position.y - this._rayCastLength - this._raySafeOffset,
			body.position.z,
		);
		// Raycast options
		const rayCastOptions = {
			collisionFilterMask: CollisionGroups.Default,
			skipBackfaces: true /* ignore back faces */,
		};
		// Cast the ray
		this._rayHasHit = this._world.physicsWorld.raycastClosest(
			start,
			end,
			rayCastOptions,
			this._rayResult,
		);
	}

	public physicsPostStep(body: CANNON.Body, avatar: Avatar): void {
		// Get velocities
		const simulatedVelocity = new THREE.Vector3(
			body.velocity.x,
			body.velocity.y,
			body.velocity.z,
		);

		// Take local velocity
		let arcadeVelocity = new THREE.Vector3()
			.copy(avatar._velocity)
			.multiplyScalar(avatar._moveSpeed);
		// Turn local into global
		arcadeVelocity = Utils.appplyVectorMatrixXZ(
			avatar._orientation,
			arcadeVelocity,
		);

		let newVelocity = new THREE.Vector3();

		// Additive velocity mode
		if (avatar._arcadeVelocityIsAdditive) {
			newVelocity.copy(simulatedVelocity);

			const globalVelocityTarget = Utils.appplyVectorMatrixXZ(
				avatar._orientation,
				avatar._velocityTarget,
			);
			const add = new THREE.Vector3()
				.copy(arcadeVelocity)
				.multiply(avatar._arcadeVelocityInfluence);

			if (
				Math.abs(simulatedVelocity.x) <
					Math.abs(globalVelocityTarget.x * avatar._moveSpeed) ||
				Utils.haveDifferentSigns(simulatedVelocity.x, arcadeVelocity.x)
			) {
				newVelocity.x += add.x;
			}
			if (
				Math.abs(simulatedVelocity.y) <
					Math.abs(globalVelocityTarget.y * avatar._moveSpeed) ||
				Utils.haveDifferentSigns(simulatedVelocity.y, arcadeVelocity.y)
			) {
				newVelocity.y += add.y;
			}
			if (
				Math.abs(simulatedVelocity.z) <
					Math.abs(globalVelocityTarget.z * avatar._moveSpeed) ||
				Utils.haveDifferentSigns(simulatedVelocity.z, arcadeVelocity.z)
			) {
				newVelocity.z += add.z;
			}
		} else {
			newVelocity = new THREE.Vector3(
				THREE.MathUtils.lerp(
					simulatedVelocity.x,
					arcadeVelocity.x,
					avatar._arcadeVelocityInfluence.x,
				),
				THREE.MathUtils.lerp(
					simulatedVelocity.y,
					arcadeVelocity.y,
					avatar._arcadeVelocityInfluence.y,
				),
				THREE.MathUtils.lerp(
					simulatedVelocity.z,
					arcadeVelocity.z,
					avatar._arcadeVelocityInfluence.z,
				),
			);
		}

		// If we're hitting the ground, stick to ground
		if (avatar._rayHasHit) {
			// Flatten velocity
			newVelocity.y = 0;

			// Move on top of moving objects
			if (avatar._rayResult.body.mass > 0) {
				const pointVelocity = new CANNON.Vec3();
				avatar._rayResult.body.getVelocityAtWorldPoint(
					avatar._rayResult.hitPointWorld,
					pointVelocity,
				);
				newVelocity.add(Utils.threeVector(pointVelocity));
			}

			// Measure the normal vector offset from direct "up" vector
			// and transform it into a matrix
			const up = new THREE.Vector3(0, 1, 0);
			const normal = new THREE.Vector3(
				avatar._rayResult.hitNormalWorld.x,
				avatar._rayResult.hitNormalWorld.y,
				avatar._rayResult.hitNormalWorld.z,
			);
			const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
			const m = new THREE.Matrix4().makeRotationFromQuaternion(q);

			// Rotate the velocity vector
			newVelocity.applyMatrix4(m);

			// Compensate for gravity
			// newVelocity.y -= body.world.physicsWorld.gravity.y / body.avatar.world.physicsFrameRate;

			// Apply velocity
			body.velocity.x = newVelocity.x;
			body.velocity.y = newVelocity.y;
			body.velocity.z = newVelocity.z;
			// Ground avatar
			body.position.y =
				avatar._rayResult.hitPointWorld.y +
				avatar._rayCastLength +
				newVelocity.y / avatar._world.physicsFrameRate;
		} else {
			// If we're in air
			body.velocity.x = newVelocity.x;
			body.velocity.y = newVelocity.y;
			body.velocity.z = newVelocity.z;

			// Save last in-air information
			avatar._groundImpactData.velocity.x = body.velocity.x;
			avatar._groundImpactData.velocity.y = body.velocity.y;
			avatar._groundImpactData.velocity.z = body.velocity.z;
		}

		// Jumping
		if (avatar._wantsToJump) {
			// If initJumpSpeed is set
			if (avatar._initJumpSpeed > -1) {
				// Flatten velocity
				body.velocity.y = 0;
				const speed = Math.max(
					avatar._velocitySimulator.position.length() * 4,
					avatar._initJumpSpeed,
				);
				body.velocity = Utils.cannonVector(
					avatar._orientation.clone().multiplyScalar(speed),
				);
			} else {
				// Moving objects compensation
				const add = new CANNON.Vec3();
				avatar._rayResult.body.getVelocityAtWorldPoint(
					avatar._rayResult.hitPointWorld,
					add,
				);
				body.velocity.vsub(add, body.velocity);
			}

			// Add positive vertical velocity
			body.velocity.y += 4;
			// Move above ground by 2x safe offset value
			body.position.y += avatar._raySafeOffset * 2;
			// Reset flag
			avatar._wantsToJump = false;
		}
	}

	public addToWorld(world: World): void {
		if (_.includes(world.avatars, this)) {
			console.warn('Adding avatar to a world in which it already exists.');
		} else {
			// Set world
			this._world = world;

			// Register avatar
			world.avatars.push(this);

			// Register physics
			world.physicsWorld.addBody(this._avatarCapsule.body);

			// Add to graphicsWorld
			world.graphicsWorld.add(this);
			world.graphicsWorld.add(this._raycastBox);

			// Shadow cascades
			// this.materials.forEach((mat) => {
			// 	world.getSky().csm.setupMaterial(mat);
			// });
		}
	}

	public removeFromWorld(world: World): void {
		const inputManager = world.inputManager;
		const avatars = world.avatars;
		const physicsWorld = world.physicsWorld;
		const graphicsWorld = world.graphicsWorld;
		if (!_.includes(avatars, this)) {
			console.warn("Removing avatar from a world in which it isn't present.");
		} else {
			if (inputManager.getInputReceiver() === this) {
				inputManager.setInputReceiver(undefined);
			}

			this._world = undefined;

			// Remove from avatars
			_.pull(avatars, this);

			// Remove physics
			physicsWorld.remove(this._avatarCapsule.body);

			// Remove visuals
			graphicsWorld.remove(this);
			graphicsWorld.remove(this._raycastBox);
		}
	}

	//getter,setter
	get world(): World {
		return this._world;
	}

	get sessionId(): string {
		return this._sessionId;
	}

	set sessionId(sessionId: string) {
		this._sessionId = sessionId;
	}

	get avatarState(): IAvatarState {
		return this._avatarState;
	}

	set controlledObject(controllableObject: IControllable) {
		this._controlledObject = controllableObject;
	}

	get avatarAnimationState(): string {
		return this._avatarAnimationState;
	}

	get avatarCapsule(): CapsuleCollider {
		return this._avatarCapsule;
	}

	get chairEntryInstance(): ChairEntryInstance {
		return this._chairEntryInstance;
	}

	set chairEntryInstance(chairEntryInstance: ChairEntryInstance) {
		this._chairEntryInstance = chairEntryInstance;
	}

	get clothingObjectInstance(): TargetObjectInstance {
		return this._clothingObjectInstance;
	}

	set clothingObjectInstance(clothingObjectInstance: TargetObjectInstance) {
		this._clothingObjectInstance = clothingObjectInstance;
	}

	get velocity(): THREE.Vector3 {
		return this._velocity;
	}

	get velocitySimulator(): VectorSpringSimulator {
		return this._velocitySimulator;
	}

	get rotationSimulator(): RelativeSpringSimulator {
		return this._rotationSimulator;
	}

	set arcadeVelocityIsAdditive(arcadeVelocityIsAdditive: boolean) {
		this._arcadeVelocityIsAdditive = arcadeVelocityIsAdditive;
	}

	get rayHasHit(): boolean {
		return this._rayHasHit;
	}

	get rayResult(): CANNON.RaycastResult {
		return this._rayResult;
	}

	get defaultVelocitySimulatorDamping(): number {
		return this._defaultVelocitySimulatorDamping;
	}

	get defaultVelocitySimulatorMass(): number {
		return this._defaultVelocitySimulatorMass;
	}

	get defaultRotationSimulatorDamping(): number {
		return this._defaultRotationSimulatorDamping;
	}

	get defaultRotationSimulatorMass(): number {
		return this._defaultRotationSimulatorMass;
	}

	get mixer(): THREE.AnimationMixer {
		return this._mixer;
	}

	get groundImpactData(): GroundImpactData {
		return this._groundImpactData;
	}

	get raycastBox(): THREE.Mesh {
		return this._raycastBox;
	}

	get sidebarCanvas(): SidebarCanvas {
		return this._sidebarCanvas;
	}

	set sidebarCanvas(sidebarCanvas: SidebarCanvas) {
		this._sidebarCanvas = sidebarCanvas;
	}

	get canInteractObjectMap(): Map<string, WorldObject> {
		return this._canInteractObjectMap;
	}
}

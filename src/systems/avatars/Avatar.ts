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
import { CollisionGroups } from '../enums/CollisionGroups';
import { CapsuleCollider } from '../physics/colliders/CapsuleCollider';
import { ChairEntryInstance } from './ChairEntryInstance';
import { GroundImpactData } from './GroundImpactData';
import { ClosestObjectFinder } from '../core/ClosestObjectFinder';
import { FontLoader, Object3D, TextGeometry } from 'three';
import { EntityType } from '../enums/EntityType';

export class Avatar extends THREE.Object3D implements IWorldEntity {
	public updateOrder = 1;
	public entityType: EntityType = EntityType.Avatar;

	public height = 0;
	public tiltContainer: THREE.Group;
	public modelContainer: THREE.Group;
	public materials: THREE.Material[] = [];
	public mixer: THREE.AnimationMixer;
	public animations: any[];

	// Movement
	public acceleration: THREE.Vector3 = new THREE.Vector3();
	public velocity: THREE.Vector3 = new THREE.Vector3();
	public arcadeVelocityInfluence: THREE.Vector3 = new THREE.Vector3();
	public velocityTarget: THREE.Vector3 = new THREE.Vector3();
	public arcadeVelocityIsAdditive = false;

	public defaultVelocitySimulatorDamping = 0.8;
	public defaultVelocitySimulatorMass = 50;
	public velocitySimulator: VectorSpringSimulator;
	public moveSpeed = 4;
	public angularVelocity = 0;
	public orientation: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
	public orientationTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
	public defaultRotationSimulatorDamping = 0.5;
	public defaultRotationSimulatorMass = 10;
	public rotationSimulator: RelativeSpringSimulator;
	public viewVector: THREE.Vector3;
	public actions: { [action: string]: KeyBinding };
	public avatarCapsule: CapsuleCollider;

	// Ray casting
	public rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
	public rayHasHit = false;
	public rayCastLength = 0.57;
	public raySafeOffset = 0.03;
	public wantsToJump = false;
	public initJumpSpeed = -1;
	public groundImpactData: GroundImpactData = new GroundImpactData();
	public raycastBox: THREE.Mesh;

	public world: World;
	public charState: IAvatarState;

	//chairs
	public controlledObject: IControllable;
	public occupyingChair: Chair = null;
	public chairEntryInstance: ChairEntryInstance = null;

	public sessionId: string;

	private physicsEnabled = true;

	public avatarAnimationState: string = null;

	constructor(gltf: any) {
		super();

		this.readAvatarData(gltf);
		this.setAnimations(gltf.animations);

		// The visuals group is centered for easy avatar tilting
		this.tiltContainer = new THREE.Group();
		this.add(this.tiltContainer);

		// Model container is used to reliably ground the avatar, as animation can alter the position of the model itself
		this.modelContainer = new THREE.Group();
		this.modelContainer.position.y = -0.57;
		this.tiltContainer.add(this.modelContainer);
		this.modelContainer.add(gltf.scene);

		this.mixer = new THREE.AnimationMixer(gltf.scene);

		this.velocitySimulator = new VectorSpringSimulator(
			60,
			this.defaultVelocitySimulatorMass,
			this.defaultVelocitySimulatorDamping,
		);
		this.rotationSimulator = new RelativeSpringSimulator(
			60,
			this.defaultRotationSimulatorMass,
			this.defaultRotationSimulatorDamping,
		);

		this.viewVector = new THREE.Vector3();

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
			enter_passenger: new KeyBinding('KeyG'),
		};

		// Physics
		// Player Capsule
		this.avatarCapsule = new CapsuleCollider({
			mass: 1,
			position: new CANNON.Vec3(),
			height: 1,
			radius: 0.3,
			segments: 8,
			friction: 0.0,
		});
		// capsulePhysics.physical.collisionFilterMask = ~CollisionGroups.Trimesh;
		this.avatarCapsule.body.shapes.forEach((shape) => {
			// tslint:disable-next-line: no-bitwise
			shape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
		});
		this.avatarCapsule.body.allowSleep = false;

		// Move avatar to different collision group for raycasting
		this.avatarCapsule.body.collisionFilterGroup = 2;

		// Disable avatar rotation
		this.avatarCapsule.body.fixedRotation = true;
		this.avatarCapsule.body.updateMassProperties();

		// Ray cast debug
		const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		const boxMat = new THREE.MeshLambertMaterial({
			color: 0xff0000,
		});
		this.raycastBox = new THREE.Mesh(boxGeo, boxMat);
		this.raycastBox.visible = false;

		// Physics pre/post step callback bindings
		this.avatarCapsule.body.preStep = (body: CANNON.Body) => {
			this.physicsPreStep(body, this);
		};
		this.avatarCapsule.body.postStep = (body: CANNON.Body) => {
			this.physicsPostStep(body, this);
		};

		// States
		this.setState(new Idle(this));
	}

	public setAnimations(animations: []): void {
		this.animations = animations;
	}

	public setArcadeVelocityInfluence(
		x: number,
		y: number = x,
		z: number = x,
	): void {
		this.arcadeVelocityInfluence.set(x, y, z);
	}

	public setViewVector(vector: THREE.Vector3): void {
		this.viewVector.copy(vector).normalize();
	}

	public setAvatarName(avatarName: string) {
		const charaterNameText = new SpriteText2D(avatarName, {
			align: textAlign.center,
			font: '20px Arial',
			fillStyle: '#000000',
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
		this.charState = state;
		this.charState.onInputChange();
	}

	public setPosition(x: number, y: number, z: number): void {
		if (this.physicsEnabled) {
			this.avatarCapsule.body.previousPosition = new CANNON.Vec3(x, y, z);
			this.avatarCapsule.body.position = new CANNON.Vec3(x, y, z);
			this.avatarCapsule.body.interpolatedPosition = new CANNON.Vec3(x, y, z);
		} else {
			this.position.x = x;
			this.position.y = y;
			this.position.z = z;
		}
	}

	public resetVelocity(): void {
		this.velocity.x = 0;
		this.velocity.y = 0;
		this.velocity.z = 0;

		this.avatarCapsule.body.velocity.x = 0;
		this.avatarCapsule.body.velocity.y = 0;
		this.avatarCapsule.body.velocity.z = 0;

		this.velocitySimulator.init();
	}

	public setArcadeVelocityTarget(velZ: number, velX = 0, velY = 0): void {
		this.velocityTarget.z = velZ;
		this.velocityTarget.x = velX;
		this.velocityTarget.y = velY;
	}

	public setOrientation(vector: THREE.Vector3, instantly = false): void {
		const lookVector = new THREE.Vector3().copy(vector).setY(0).normalize();
		this.orientationTarget.copy(lookVector);

		if (instantly) {
			this.orientation.copy(lookVector);
		}
	}

	public resetOrientation(): void {
		const forward = Utils.getForward(this);
		this.setOrientation(forward, true);
	}

	public setPhysicsEnabled(value: boolean): void {
		this.physicsEnabled = value;
		const physicsWorld = this.world.getPhysicsWorld();

		if (value === true) {
			physicsWorld.addBody(this.avatarCapsule.body);
		} else {
			physicsWorld.remove(this.avatarCapsule.body);
		}
	}

	public readAvatarData(gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				Utils.setupMeshProperties(child);

				if (child.material !== undefined) {
					this.materials.push(child.material);
				}
			}
		});
	}

	public handleKeyboardEvent(
		event: KeyboardEvent,
		code: string,
		pressed: boolean,
	): void {
		if (this.controlledObject !== undefined) {
			this.controlledObject.handleKeyboardEvent(event, code, pressed);
		} else {
			const cameraOperator = this.world.getCameraOperator()
			// Free camera
			if (code === 'KeyC' && pressed === true && event.shiftKey === true) {
				this.resetControls();
				cameraOperator.setAvatarCaller(this);
				this.world.getInputManager().setInputReceiver(cameraOperator);
			} else if (
				code === 'KeyR' &&
				pressed === true &&
				event.shiftKey === true
			) {
				//this.world.restartScenario();
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

	public handleMouseButton(
		event: MouseEvent,
		code: string,
		pressed: boolean,
	): void {
		if (this.controlledObject !== undefined) {
			this.controlledObject.handleMouseButton(event, code, pressed);
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
		if (this.controlledObject !== undefined) {
			this.controlledObject.handleMouseMove(event, deltaX, deltaY);
		} else {
			this.world.getCameraOperator().move(deltaX, deltaY);
		}
	}

	public handleMouseWheel(event: WheelEvent, value: number): void {
		if (this.controlledObject !== undefined) {
			this.controlledObject.handleMouseWheel(event, value);
		} else {
			//this.world.scrollTheTimeScale(value);
		}
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
			this.charState.onInputChange();

			// Reset the 'just' attributes
			action.justPressed = false;
			action.justReleased = false;
		}
	}

	public takeControl(): void {
		if (this.world !== undefined) {
			this.world.getInputManager().setInputReceiver(this);
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
		this.chairEntryInstance?.update(timeStep);
		// console.log(this.occupyingSeat);
		this.charState?.update(timeStep);

		// this.visuals.position.copy(this.modelOffset);
		if (this.physicsEnabled) this.springMovement(timeStep);
		if (this.physicsEnabled) this.springRotation(timeStep);
		if (this.physicsEnabled) this.rotateModel();
		if (this.mixer !== undefined) this.mixer.update(timeStep);

		// Sync physics/graphics
		if (this.physicsEnabled) {
			this.position.set(
				this.avatarCapsule.body.interpolatedPosition.x,
				this.avatarCapsule.body.interpolatedPosition.y,
				this.avatarCapsule.body.interpolatedPosition.z,
			);
		} else {
			const newPos = new THREE.Vector3();
			this.getWorldPosition(newPos);

			this.avatarCapsule.body.position.copy(Utils.cannonVector(newPos));
			this.avatarCapsule.body.interpolatedPosition.copy(
				Utils.cannonVector(newPos),
			);
		}

		this.updateMatrixWorld();
	}

	public inputReceiverInit(): void {
		if (this.controlledObject !== undefined) {
			this.controlledObject.inputReceiverInit();
			return;
		}
		const cameraOperator = this.world.getCameraOperator();
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
		if (this.controlledObject !== undefined) {
			this.controlledObject.inputReceiverUpdate(timeStep);
		} else {
			// Look in camera's direction
			this.viewVector = new THREE.Vector3().subVectors(
				this.position,
				this.world.getCamera().position,
			);
			this.getWorldPosition(this.world.getCameraOperator().getTarget());
		}
	}

	public setAvatarAnimationState(clipName: string): void {
		this.avatarAnimationState = clipName;
	}

	public setAnimation(clipName: string, fadeIn: number): number {
		if (this.mixer !== undefined) {
			// gltf
			const clip = THREE.AnimationClip.findByName(this.animations, clipName);

			this.setAvatarAnimationState(clipName);

			const action = this.mixer.clipAction(clip);
			if (action === null) {
				console.error(`Animation ${clipName} not found!`);
				return 0;
			}

			this.mixer.stopAllAction();
			action.fadeIn(fadeIn);
			action.play();

			return action.getClip().duration;
		}
	}

	public setAnimation2(clipName: string, fadeIn: number): number {
		if (this.mixer !== undefined) {
			// gltf
			const clip = THREE.AnimationClip.findByName(this.animations, clipName);

			const action: THREE.AnimationAction = this.mixer.clipAction(clip);
			if (action === null) {
				console.error(`Animation ${clipName} not found!`);
				return 0;
			}
			//console.log(clipName)
			//console.log(action.isRunning())
			if (!action.isRunning()) {
				this.mixer.stopAllAction();
				action.fadeIn(fadeIn);
				action.play();
			}
			return action.getClip().duration;
		}
	}

	public springMovement(timeStep: number): void {
		// Simulator
		this.velocitySimulator.target.copy(this.velocityTarget);
		this.velocitySimulator.simulate(timeStep);

		// Update values
		this.velocity.copy(this.velocitySimulator.position);
		this.acceleration.copy(this.velocitySimulator.velocity);
	}

	public springRotation(timeStep: number): void {
		// Spring rotation
		// Figure out angle between current and target orientation
		const angle = Utils.getSignedAngleBetweenVectors(
			this.orientation,
			this.orientationTarget,
		);

		// Simulator
		this.rotationSimulator.target = angle;
		this.rotationSimulator.simulate(timeStep);
		const rot = this.rotationSimulator.position;

		// Updating values
		this.orientation.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
		this.angularVelocity = this.rotationSimulator.velocity;
	}

	public getLocalMovementDirection(): THREE.Vector3 {
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

	public getCameraRelativeMovementVector(): THREE.Vector3 {
		const localDirection = this.getLocalMovementDirection();
		const flatViewVector = new THREE.Vector3(
			this.viewVector.x,
			0,
			this.viewVector.z,
		).normalize();

		return Utils.appplyVectorMatrixXZ(flatViewVector, localDirection);
	}

	public setCameraRelativeOrientationTarget(): void {
		if (this.chairEntryInstance === null) {
			const moveVector = this.getCameraRelativeMovementVector();

			if (moveVector.x === 0 && moveVector.y === 0 && moveVector.z === 0) {
				this.setOrientation(this.orientation);
			} else {
				this.setOrientation(moveVector);
			}
		}
	}

	public rotateModel(): void {
		this.lookAt(
			this.position.x + this.orientation.x,
			this.position.y + this.orientation.y,
			this.position.z + this.orientation.z,
		);
	}

	public jump(initJumpSpeed = -1): void {
		this.wantsToJump = true;
		this.initJumpSpeed = initJumpSpeed;
	}

	public findChairToEnter(wantsToSit: boolean): void {
		// reusable world position variable
		const worldPos = new THREE.Vector3();

		// Find best chair
		const chairFinder = new ClosestObjectFinder<Chair>(this.position, 1);
		this.world.getChairs().forEach((chair) => {
			chairFinder.consider(chair, chair.position);
		});

		if (chairFinder.closestObject !== undefined) {
			const chair = chairFinder.closestObject;
			const chairEntryInstance = new ChairEntryInstance(this);

			chair.getSeatPointObject().getWorldPosition(worldPos);
			chairFinder.consider(chair, worldPos);

			if (chairFinder.closestObject !== undefined) {
				const targetChair = chairFinder.closestObject;
				chairEntryInstance.setTargetChair(targetChair);

				const entryPointFinder = new ClosestObjectFinder<Object3D>(
					this.position,
				);

				const point = targetChair.getEntryPoints();
				point.getWorldPosition(worldPos);
				entryPointFinder.consider(point, worldPos);

				if (entryPointFinder.closestObject !== undefined) {
					chairEntryInstance.setEntryPoint(entryPointFinder.closestObject);
					this.triggerAction('up', true);
					this.chairEntryInstance = chairEntryInstance;
				}
			}
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
		if (this.occupyingChair !== null) {
			this.setState(new ExitingChair(this, this.occupyingChair));
		}
	}

	public occupySeat(chair: Chair): void {
		this.occupyingChair = chair;
		chair.setOccupiedBy(this);
	}

	public leaveSeat(): void {
		if (this.occupyingChair !== null) {
			this.occupyingChair.setOccupiedBy(null);
		}
	}

	public physicsPreStep(body: CANNON.Body, avatar: Avatar): void {
		avatar.feetRaycast();

		// Raycast debug
		if (avatar.rayHasHit) {
			if (avatar.raycastBox.visible) {
				avatar.raycastBox.position.x = avatar.rayResult.hitPointWorld.x;
				avatar.raycastBox.position.y = avatar.rayResult.hitPointWorld.y;
				avatar.raycastBox.position.z = avatar.rayResult.hitPointWorld.z;
			}
		} else {
			if (avatar.raycastBox.visible) {
				avatar.raycastBox.position.set(
					body.position.x,
					body.position.y - avatar.rayCastLength - avatar.raySafeOffset,
					body.position.z,
				);
			}
		}
	}

	public feetRaycast(): void {
		// Player ray casting
		// Create ray
		const body = this.avatarCapsule.body;
		const start = new CANNON.Vec3(
			body.position.x,
			body.position.y,
			body.position.z,
		);
		const end = new CANNON.Vec3(
			body.position.x,
			body.position.y - this.rayCastLength - this.raySafeOffset,
			body.position.z,
		);
		// Raycast options
		const rayCastOptions = {
			collisionFilterMask: CollisionGroups.Default,
			skipBackfaces: true /* ignore back faces */,
		};
		// Cast the ray
		this.rayHasHit = this.world.getPhysicsWorld().raycastClosest(
			start,
			end,
			rayCastOptions,
			this.rayResult,
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
			.copy(avatar.velocity)
			.multiplyScalar(avatar.moveSpeed);
		// Turn local into global
		arcadeVelocity = Utils.appplyVectorMatrixXZ(
			avatar.orientation,
			arcadeVelocity,
		);

		let newVelocity = new THREE.Vector3();

		// Additive velocity mode
		if (avatar.arcadeVelocityIsAdditive) {
			newVelocity.copy(simulatedVelocity);

			const globalVelocityTarget = Utils.appplyVectorMatrixXZ(
				avatar.orientation,
				avatar.velocityTarget,
			);
			const add = new THREE.Vector3()
				.copy(arcadeVelocity)
				.multiply(avatar.arcadeVelocityInfluence);

			if (
				Math.abs(simulatedVelocity.x) <
					Math.abs(globalVelocityTarget.x * avatar.moveSpeed) ||
				Utils.haveDifferentSigns(simulatedVelocity.x, arcadeVelocity.x)
			) {
				newVelocity.x += add.x;
			}
			if (
				Math.abs(simulatedVelocity.y) <
					Math.abs(globalVelocityTarget.y * avatar.moveSpeed) ||
				Utils.haveDifferentSigns(simulatedVelocity.y, arcadeVelocity.y)
			) {
				newVelocity.y += add.y;
			}
			if (
				Math.abs(simulatedVelocity.z) <
					Math.abs(globalVelocityTarget.z * avatar.moveSpeed) ||
				Utils.haveDifferentSigns(simulatedVelocity.z, arcadeVelocity.z)
			) {
				newVelocity.z += add.z;
			}
		} else {
			newVelocity = new THREE.Vector3(
				THREE.MathUtils.lerp(
					simulatedVelocity.x,
					arcadeVelocity.x,
					avatar.arcadeVelocityInfluence.x,
				),
				THREE.MathUtils.lerp(
					simulatedVelocity.y,
					arcadeVelocity.y,
					avatar.arcadeVelocityInfluence.y,
				),
				THREE.MathUtils.lerp(
					simulatedVelocity.z,
					arcadeVelocity.z,
					avatar.arcadeVelocityInfluence.z,
				),
			);
		}

		// If we're hitting the ground, stick to ground
		if (avatar.rayHasHit) {
			// Flatten velocity
			newVelocity.y = 0;

			// Move on top of moving objects
			if (avatar.rayResult.body.mass > 0) {
				const pointVelocity = new CANNON.Vec3();
				avatar.rayResult.body.getVelocityAtWorldPoint(
					avatar.rayResult.hitPointWorld,
					pointVelocity,
				);
				newVelocity.add(Utils.threeVector(pointVelocity));
			}

			// Measure the normal vector offset from direct "up" vector
			// and transform it into a matrix
			const up = new THREE.Vector3(0, 1, 0);
			const normal = new THREE.Vector3(
				avatar.rayResult.hitNormalWorld.x,
				avatar.rayResult.hitNormalWorld.y,
				avatar.rayResult.hitNormalWorld.z,
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
				avatar.rayResult.hitPointWorld.y +
				avatar.rayCastLength +
				newVelocity.y / avatar.world.getPhysicsFrameRate();
		} else {
			// If we're in air
			body.velocity.x = newVelocity.x;
			body.velocity.y = newVelocity.y;
			body.velocity.z = newVelocity.z;

			// Save last in-air information
			avatar.groundImpactData.velocity.x = body.velocity.x;
			avatar.groundImpactData.velocity.y = body.velocity.y;
			avatar.groundImpactData.velocity.z = body.velocity.z;
		}

		// Jumping
		if (avatar.wantsToJump) {
			// If initJumpSpeed is set
			if (avatar.initJumpSpeed > -1) {
				// Flatten velocity
				body.velocity.y = 0;
				const speed = Math.max(
					avatar.velocitySimulator.position.length() * 4,
					avatar.initJumpSpeed,
				);
				body.velocity = Utils.cannonVector(
					avatar.orientation.clone().multiplyScalar(speed),
				);
			} else {
				// Moving objects compensation
				const add = new CANNON.Vec3();
				avatar.rayResult.body.getVelocityAtWorldPoint(
					avatar.rayResult.hitPointWorld,
					add,
				);
				body.velocity.vsub(add, body.velocity);
			}

			// Add positive vertical velocity
			body.velocity.y += 4;
			// Move above ground by 2x safe offset value
			body.position.y += avatar.raySafeOffset * 2;
			// Reset flag
			avatar.wantsToJump = false;
		}
	}

	public addToWorld(world: World): void {
		if (_.includes(world.getAvatars(), this)) {
			console.warn('Adding avatar to a world in which it already exists.');
		} else {
			// Set world
			this.world = world;

			// Register avatar
			world.getAvatars().push(this);

			// Register physics
			world.getPhysicsWorld().addBody(this.avatarCapsule.body);

			// Add to graphicsWorld
			world.getGraphicsWorld().add(this);
			world.getGraphicsWorld().add(this.raycastBox);

			// Shadow cascades
			this.materials.forEach((mat) => {
				world.getSky().csm.setupMaterial(mat);
			});
		}
	}

	public removeFromWorld(world: World): void {
		const inputManager = world.getInputManager();
		const avatars = world.getAvatars();
		const physicsWorld = world.getPhysicsWorld();
		const graphicsWorld = world.getGraphicsWorld();
		if (!_.includes(avatars, this)) {
			console.warn("Removing avatar from a world in which it isn't present.");
		} else {
			if (inputManager.inputReceiver === this) {
				inputManager.inputReceiver = undefined;
			}

			this.world = undefined;

			// Remove from avatars
			_.pull(avatars, this);

			// Remove physics
			physicsWorld.remove(this.avatarCapsule.body);

			// Remove visuals
			graphicsWorld.remove(this);
			graphicsWorld.remove(this.raycastBox);
		}
	}
}

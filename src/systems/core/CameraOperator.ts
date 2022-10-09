import * as THREE from 'three';
import * as Utils from './FunctionLibrary';
import { World } from '../world/World';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { KeyBinding } from './KeyBinding';
import { Avatar } from '../avatars/Avatar';
import _ = require('lodash');
import { IUpdatable } from '../interfaces/IUpdatable';

export class CameraOperator implements IInputReceiver, IUpdatable {
	public updateOrder = 4;
	public actions: { [action: string]: KeyBinding };

	private _world: World;
	private _camera: THREE.Camera;
	private _target: THREE.Vector3;
	private _sensitivity: THREE.Vector2;
	private _radius = 1;
	private _theta: number;
	private _phi: number;
	private _onMouseDownPosition: THREE.Vector2;
	private _onMouseDownTheta: any;
	private _onMouseDownPhi: any;
	private _targetRadius = 1;

	private _movementSpeed: number;

	private _upVelocity = 0;
	private _forwardVelocity = 0;
	private _rightVelocity = 0;

	private _followMode = false;

	private _avatarCaller: Avatar;

	constructor(
		world: World,
		camera: THREE.Camera,
		sensitivityX = 1,
		sensitivityY: number = sensitivityX * 0.8,
	) {
		this._world = world;
		this._camera = camera;
		this._target = new THREE.Vector3();
		this._sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);

		this._movementSpeed = 0.06;
		this._radius = 3;
		this._theta = 0;
		this._phi = 0;

		this._onMouseDownPosition = new THREE.Vector2();
		this._onMouseDownTheta = this._theta;
		this._onMouseDownPhi = this._phi;

		this.actions = {
			forward: new KeyBinding('KeyW'),
			back: new KeyBinding('KeyS'),
			left: new KeyBinding('KeyA'),
			right: new KeyBinding('KeyD'),
			up: new KeyBinding('KeyE'),
			down: new KeyBinding('KeyQ'),
			fast: new KeyBinding('ShiftLeft'),
		};

		world.registerUpdatable(this);
	}

	public setSensitivity(
		sensitivityX: number,
		sensitivityY: number = sensitivityX,
	): void {
		this._sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);
	}

	public setRadius(value: number, instantly = false): void {
		this._targetRadius = Math.max(0.001, value);
		if (instantly === true) {
			this._radius = value;
		}
	}

	public move(deltaX: number, deltaY: number): void {
		this._theta -= deltaX * (this._sensitivity.x / 2);
		this._theta %= 360;
		this._phi += deltaY * (this._sensitivity.y / 2);
		this._phi = Math.min(85, Math.max(-85, this._phi));
	}

	public update(timeScale: number): void {
		if (this._followMode === true) {
			this._camera.position.y = THREE.MathUtils.clamp(
				this._camera.position.y,
				this._target.y,
				Number.POSITIVE_INFINITY,
			);
			const newPos = this._target
				.clone()
				.add(
					new THREE.Vector3()
						.subVectors(this._camera.position, this._target)
						.normalize()
						.multiplyScalar(this._targetRadius),
				);
			this._camera.position.x = newPos.x;
			this._camera.position.y = newPos.y;
			this._camera.position.z = newPos.z;
		} else {
			this._target.y += 0.8;
			this._radius = THREE.MathUtils.lerp(this._radius, this._targetRadius, 0.1);
			this._camera.position.x =
				this._target.x +
				this._radius *
					Math.sin((this._theta * Math.PI) / 180) *
					Math.cos((this._phi * Math.PI) / 180);
			this._camera.position.y =
				this._target.y + this._radius * Math.sin((this._phi * Math.PI) / 180);
			this._camera.position.z =
				this._target.z +
				this._radius *
					Math.cos((this._theta * Math.PI) / 180) *
					Math.cos((this._phi * Math.PI) / 180);
			this._camera.updateMatrix();
			this._camera.lookAt(this._target);
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
					binding.isPressed = pressed;
				}
			}
		}
	}

	public handleMouseWheel(event: WheelEvent, value: number): void {
		//this._world.scrollTheTimeScale(value);
	}

	public handleMouseButton(
		event: MouseEvent,
		code: string,
		pressed: boolean,
	): void {
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				const binding = this.actions[action];

				if (_.includes(binding.eventCodes, code)) {
					binding.isPressed = pressed;
				}
			}
		}
	}

	public handleMouseMove(
		event: MouseEvent,
		deltaX: number,
		deltaY: number,
	): void {
		this.move(deltaX, deltaY);
	}

	public inputReceiverInit(): void {
		this._target.copy(this._camera.position);
		this.setRadius(0, true);
		// this._world.dirLight.target = this._world.camera;

		// this._world.updateControls([
		// 	{
		// 		keys: ['W', 'S', 'A', 'D'],
		// 		desc: 'Move around',
		// 	},
		// 	{
		// 		keys: ['E', 'Q'],
		// 		desc: 'Move up / down',
		// 	},
		// 	{
		// 		keys: ['Shift'],
		// 		desc: 'Speed up',
		// 	},
		// 	{
		// 		keys: ['Shift', '+', 'C'],
		// 		desc: 'Exit free camera mode',
		// 	},
		// ]);
	}

	public inputReceiverUpdate(timeStep: number): void {
		// Set fly speed
		const speed =
			this._movementSpeed *
			(this.actions.fast.isPressed ? timeStep * 600 : timeStep * 60);

		const up = Utils.getUp(this._camera);
		const right = Utils.getRight(this._camera);
		const forward = Utils.getBack(this._camera);

		this._upVelocity = THREE.MathUtils.lerp(
			this._upVelocity,
			+this.actions.up.isPressed - +this.actions.down.isPressed,
			0.3,
		);
		this._forwardVelocity = THREE.MathUtils.lerp(
			this._forwardVelocity,
			+this.actions.forward.isPressed - +this.actions.back.isPressed,
			0.3,
		);
		this._rightVelocity = THREE.MathUtils.lerp(
			this._rightVelocity,
			+this.actions.right.isPressed - +this.actions.left.isPressed,
			0.3,
		);

		this._target.add(up.multiplyScalar(speed * this._upVelocity));
		this._target.add(forward.multiplyScalar(speed * this._forwardVelocity));
		this._target.add(right.multiplyScalar(speed * this._rightVelocity));
	}

	public getTarget(): THREE.Vector3 {
		return this._target;
	}

	public getAvatarCaller(): Avatar {
		return this._avatarCaller;
	}

	public setAvatarCaller(avatar: Avatar) {
		this._avatarCaller = avatar;
	}

	public setFollowMode(followMode: boolean) {
		this._followMode = followMode;
	}
}

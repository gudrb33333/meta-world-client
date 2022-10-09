import nipplejs from 'nipplejs';
import * as THREE from 'three';
import { IUpdatable } from '../interfaces/IUpdatable';
import { World } from '../world/World';
import { InputManager } from './InputManager';
import styles from './Joystick.module.css';

const ROTATION_SPEED = 10;

export class Joystick implements IUpdatable {
	public updateOrder = 10;
	private _inputManager: InputManager;
	private _world: World;

	private _mockJoystickContainer: HTMLDivElement;
	private _leftMock: HTMLDivElement;
	private _leftMockSmall: HTMLDivElement;
	private _rightMock: HTMLDivElement;
	private _rightMockSmall: HTMLDivElement;
	private _leftTouchZone: HTMLDivElement;
	private _rightTouchZone: HTMLDivElement;
	private _leftStick: nipplejs.JoystickManager;
	private _rightStick: nipplejs.JoystickManager;
	private _moving: boolean;
	private _rotating: boolean;
	private _displacement: THREE.Vector3;
	private _lookDy: number;
	private _lookDx: number;

	constructor(world: World, inputManager: InputManager) {
		this._world = world;
		this._inputManager = inputManager;

		this.onFirstInteraction = this.onFirstInteraction.bind(this);
		this.onMoveJoystickChanged = this.onMoveJoystickChanged.bind(this);
		this.onMoveJoystickEnd = this.onMoveJoystickEnd.bind(this);
		this.onLookJoystickChanged = this.onLookJoystickChanged.bind(this);
		this.onLookJoystickEnd = this.onLookJoystickEnd.bind(this);

		this._mockJoystickContainer = document.createElement('div');
		this._mockJoystickContainer.classList.add(styles.mockJoystickContainer);
		this._leftMock = document.createElement('div');
		this._leftMock.classList.add(styles.mockJoystick);
		this._leftMockSmall = document.createElement('div');
		this._leftMockSmall.classList.add(styles.mockJoystick, styles.inner);
		this._leftMock.appendChild(this._leftMockSmall);
		this._mockJoystickContainer.appendChild(this._leftMock);
		this._rightMock = document.createElement('div');
		this._rightMock.classList.add(styles.mockJoystick);
		this._rightMockSmall = document.createElement('div');
		this._rightMockSmall.classList.add(styles.mockJoystick, styles.inner);
		this._rightMock.appendChild(this._rightMockSmall);
		this._mockJoystickContainer.appendChild(this._rightMock);

		this.insertAfter(
			this._mockJoystickContainer,
			document.getElementById('main-canvas'),
		);
		this.createLeftStick();
		this.createRightStick();

		this._moving = false;
		this._rotating = false;

		this._displacement = new THREE.Vector3();
		this._lookDy = 0;
		this._lookDx = 0;

		world.registerUpdatable(this);
	}

	private insertAfter(el, referenceEl) {
		referenceEl.parentNode.insertBefore(el, referenceEl.nextSibling);
	}

	private createLeftStick(): void {
		this._leftTouchZone = document.createElement('div');
		this._leftTouchZone.classList.add(styles.touchZone, styles.left);
		this.insertAfter(this._leftTouchZone, this._mockJoystickContainer);
		this._leftStick = nipplejs.create({
			mode: 'static',
			position: { left: '50%', top: '50%' },
			zone: this._leftTouchZone,
			color: 'white',
			fadeTime: 0,
		});
		this._leftStick[0].ui.el.style.removeProperty('z-index');
		this._leftStick.on('start', this.onFirstInteraction);
		this._leftStick.on('move', this.onMoveJoystickChanged);
		this._leftStick.on('end', this.onMoveJoystickEnd);
	}

	private createRightStick(): void {
		this._rightTouchZone = document.createElement('div');
		this._rightTouchZone.classList.add(styles.touchZone, styles.right);
		this.insertAfter(this._rightTouchZone, this._mockJoystickContainer);
		this._rightStick = nipplejs.create({
			mode: 'static',
			position: { left: '50%', top: '50%' },
			zone: this._rightTouchZone,
			color: 'white',
			fadeTime: 0,
		});
		// nipplejs sets z-index 999 but it makes the joysticks
		// visible even if the scene is hidden for example by
		// preference dialog. So remove z-index.
		this._rightStick[0].ui.el.style.removeProperty('z-index');
		this._rightStick.on('start', this.onFirstInteraction);
		this._rightStick.on('move', this.onLookJoystickChanged);
		this._rightStick.on('end', this.onLookJoystickEnd);
	}

	private onFirstInteraction(): void {
		if (this._leftStick) this._leftStick.off('start', this.onFirstInteraction);
		if (this._rightStick) this._rightStick.off('start', this.onFirstInteraction);
		this._mockJoystickContainer.parentNode &&
			this._mockJoystickContainer.parentNode.removeChild(
				this._mockJoystickContainer,
			);
	}

	private onMoveJoystickChanged(event, joystick): void {
		const angle = joystick.angle.radian;
		const force = joystick.force < 1 ? joystick.force : 1;
		this._displacement
			.set(Math.cos(angle), 0, -Math.sin(angle))
			.multiplyScalar(force * 1.85);
		this._displacement.x = -this._displacement.x;
		this._displacement.z = -this._displacement.z;
		this._moving = true;
		this._inputManager.onLeftJoysickDown(this._displacement, 'KeyW', this._moving);
	}

	private onMoveJoystickEnd(): void {
		this._moving = false;
		this._displacement.set(0, 0, 0);
		this._inputManager.onLeftJoysickUp(this._displacement, 'KeyW', this._moving);
	}

	private onLookJoystickChanged(event, joystick) {
		// Set pitch and yaw angles on right stick move
		const angle = joystick.angle.radian;
		const force = joystick.force < 1 ? joystick.force : 1;
		this._rotating = true;
		this._lookDy = -Math.sin(angle) * force * ROTATION_SPEED;
		this._lookDx = Math.cos(angle) * force * ROTATION_SPEED;
		this._inputManager.onRightJoystickDown(
			this._lookDx,
			this._lookDy,
			this._rotating,
		);
	}

	private onLookJoystickEnd() {
		this._rotating = false;
		this._lookDx = 0;
		this._lookDy = 0;
		this._inputManager.onRightJoystickUp(
			this._lookDx,
			this._lookDy,
			this._rotating,
		);
	}

	update(timestep: number, unscaledTimeStep: number): void {
		if (this._rotating) {
			this._inputManager.onRightJoystickDown(
				this._lookDx,
				this._lookDy,
				this._rotating,
			);
		}
	}
}

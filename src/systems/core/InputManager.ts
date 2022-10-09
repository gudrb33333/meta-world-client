import { World } from '../world/World';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { IUpdatable } from '../interfaces/IUpdatable';

export class InputManager implements IUpdatable {
	public updateOrder = 3;

	private _world: World;
	private _domElement: HTMLElement;
	private _pointerLock: boolean;
	private _isLocked: boolean;
	private _inputReceiver: IInputReceiver;

	private _boundOnMouseDown: (evt: MouseEvent) => void;
	private _boundOnMouseMove: (evt: MouseEvent) => void;
	private _boundOnMouseUp: (evt: MouseEvent) => void;
	private _boundOnMouseWheelMove: (evt: WheelEvent) => void;
	private _boundOnPointerlockChange: (evt: PointerEvent) => void;
	private _boundOnPointerlockError: (evt: PointerEvent) => void;
	private _boundOnKeyDown: (evt: KeyboardEvent) => void;
	private _boundOnKeyUp: (evt: KeyboardEvent) => void;
	private _boundOnDomElementBlur: (evt: FocusEvent) => void;

	constructor(world: World, domElement: HTMLElement) {
		this._world = world;
		this._pointerLock = world.params.Pointer_Lock;
		this._domElement = domElement || document.body;
		this._isLocked = false;

		// Bindings for later event use
		// Mouse
		this._boundOnMouseDown = (evt: MouseEvent) => this.onMouseDown(evt);
		this._boundOnMouseMove = (evt: MouseEvent) => this.onMouseMove(evt);
		this._boundOnMouseUp = (evt: MouseEvent) => this.onMouseUp(evt);
		this._boundOnMouseWheelMove = (evt: WheelEvent) =>
			this.onMouseWheelMove(evt);

		// Pointer lock
		this._boundOnPointerlockChange = (evt: PointerEvent) =>
			this.onPointerlockChange(evt);
		this._boundOnPointerlockError = (evt: PointerEvent) =>
			this.onPointerlockError(evt);

		// Keys
		this._boundOnKeyDown = (evt: KeyboardEvent) => this.onKeyDown(evt);
		this._boundOnKeyUp = (evt: KeyboardEvent) => this.onKeyUp(evt);

		// focus
		this._boundOnDomElementBlur = (evt: FocusEvent) => this.domElementBlur(evt);

		// Init event listeners
		// Mouse
		this._domElement.addEventListener(
			'mousedown',
			this._boundOnMouseDown,
			false,
		);
		document.addEventListener('wheel', this._boundOnMouseWheelMove, false);
		document.addEventListener(
			'pointerlockchange',
			this._boundOnPointerlockChange,
			false,
		);
		document.addEventListener(
			'pointerlockerror',
			this._boundOnPointerlockError,
			false,
		);

		// Keys
		document.addEventListener('keydown', this._boundOnKeyDown, false);
		document.addEventListener('keyup', this._boundOnKeyUp, false);

		// focus
		domElement.addEventListener('focus', () => {
			console.log('canvas focused');
		});
		domElement.addEventListener('blur', this._boundOnDomElementBlur);

		world.registerUpdatable(this);
	}

	public update(timestep: number, unscaledTimeStep: number): void {
		const cameraOperator = this._world.cameraOperator;

		if (
			this._inputReceiver === undefined &&
			this._world !== undefined &&
			cameraOperator !== undefined
		) {
			this.setInputReceiver(cameraOperator);
		}

		this._inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
	}

	public getInputReceiver(): IInputReceiver {
		return this._inputReceiver;
	}

	public setInputReceiver(receiver: IInputReceiver): void {
		this._inputReceiver = receiver;
		this._inputReceiver.inputReceiverInit();
	}

	public setPointerLock(enabled: boolean): void {
		this._pointerLock = enabled;
	}

	public onPointerlockChange(event: MouseEvent): void {
		if (document.pointerLockElement === this._domElement) {
			this._domElement.addEventListener(
				'mousemove',
				this._boundOnMouseMove,
				false,
			);
			this._domElement.addEventListener('mouseup', this._boundOnMouseUp, false);
			this._isLocked = true;
		} else {
			this._domElement.removeEventListener(
				'mousemove',
				this._boundOnMouseMove,
				false,
			);
			this._domElement.removeEventListener(
				'mouseup',
				this._boundOnMouseUp,
				false,
			);
			this._isLocked = false;
		}
	}

	public onPointerlockError(event: MouseEvent): void {
		console.error('PointerLockControls: Unable to use Pointer Lock API');
	}

	public onMouseDown(event: MouseEvent): void {
		if (this._pointerLock) {
			this._domElement.requestPointerLock();
		} else {
			this._domElement.addEventListener(
				'mousemove',
				this._boundOnMouseMove,
				false,
			);
			this._domElement.addEventListener('mouseup', this._boundOnMouseUp, false);
		}

		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleMouseButton(
				event,
				'mouse' + event.button,
				true,
			);
		}
	}

	public onMouseMove(event: MouseEvent): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleMouseMove(
				event,
				event.movementX,
				event.movementY,
			);
		}
	}

	public onMouseUp(event: MouseEvent): void {
		if (!this._pointerLock) {
			this._domElement.removeEventListener(
				'mousemove',
				this._boundOnMouseMove,
				false,
			);
			this._domElement.removeEventListener(
				'mouseup',
				this._boundOnMouseUp,
				false,
			);
		}

		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleMouseButton(
				event,
				'mouse' + event.button,
				false,
			);
		}
	}

	public onKeyDown(event: KeyboardEvent): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleKeyboardEvent(event, event.code, true);
		}
	}

	public onKeyUp(event: KeyboardEvent): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleKeyboardEvent(event, event.code, false);
		}
	}

	public onLeftJoysickDown(
		displacement: THREE.Vector3,
		code: string,
		pressed: boolean,
	): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleLeftJoystickEvent(displacement, code, pressed);
		}
	}

	public onLeftJoysickUp(
		displacement: THREE.Vector3,
		code: string,
		pressed: boolean,
	): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleLeftJoystickEvent(displacement, code, pressed);
		}
	}

	public onRightJoystickDown(
		lookDx: number,
		lookDy: number,
		pressed: boolean,
	): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleRightJoystickEvent(lookDx, lookDy, pressed);
		}
	}

	public onRightJoystickUp(
		lookDx: number,
		lookDy: number,
		pressed: boolean,
	): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleRightJoystickEvent(lookDx, lookDy, pressed);
		}
	}

	public onMouseWheelMove(event: WheelEvent): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleMouseWheel(event, event.deltaY);
		}
	}

	public domElementBlur(event: FocusEvent): void {
		if (this._inputReceiver !== undefined) {
			this._inputReceiver.handleDomElementBlurEvent(event);
		}
	}
}

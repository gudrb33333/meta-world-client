import { World } from '../world/World';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { IUpdatable } from '../interfaces/IUpdatable';

export class InputManager implements IUpdatable {
	public updateOrder = 3;

	private world: World;
	private domElement: any;
	private pointerLock: any;
	private isLocked: boolean;
	private inputReceiver: IInputReceiver;

	public boundOnMouseDown: (evt: any) => void;
	public boundOnMouseMove: (evt: any) => void;
	public boundOnMouseUp: (evt: any) => void;
	public boundOnMouseWheelMove: (evt: any) => void;
	public boundOnPointerlockChange: (evt: any) => void;
	public boundOnPointerlockError: (evt: any) => void;
	public boundOnKeyDown: (evt: any) => void;
	public boundOnKeyUp: (evt: any) => void;

	constructor(world: World, domElement: HTMLElement) {
		this.world = world;
		this.pointerLock = world.getParams().Pointer_Lock;
		this.domElement = domElement || document.body;
		this.isLocked = false;

		// Bindings for later event use
		// Mouse
		this.boundOnMouseDown = (evt) => this.onMouseDown(evt);
		this.boundOnMouseMove = (evt) => this.onMouseMove(evt);
		this.boundOnMouseUp = (evt) => this.onMouseUp(evt);
		this.boundOnMouseWheelMove = (evt) => this.onMouseWheelMove(evt);

		// Pointer lock
		this.boundOnPointerlockChange = (evt) => this.onPointerlockChange(evt);
		this.boundOnPointerlockError = (evt) => this.onPointerlockError(evt);

		// Keys
		this.boundOnKeyDown = (evt) => this.onKeyDown(evt);
		this.boundOnKeyUp = (evt) => this.onKeyUp(evt);

		// Init event listeners
		// Mouse
		this.domElement.addEventListener('mousedown', this.boundOnMouseDown, false);
		document.addEventListener('wheel', this.boundOnMouseWheelMove, false);
		document.addEventListener(
			'pointerlockchange',
			this.boundOnPointerlockChange,
			false,
		);
		document.addEventListener(
			'pointerlockerror',
			this.boundOnPointerlockError,
			false,
		);

		// Keys
		document.addEventListener('keydown', this.boundOnKeyDown, false);
		document.addEventListener('keyup', this.boundOnKeyUp, false);

		world.registerUpdatable(this);
	}

	public update(timestep: number, unscaledTimeStep: number): void {
		const cameraOperator = this.world.getCameraOperator();

		if (
			this.inputReceiver === undefined &&
			this.world !== undefined &&
			cameraOperator !== undefined
		) {
			this.setInputReceiver(cameraOperator);
		}

		this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
	}

	public getInputReceiver(): IInputReceiver {
		return this.inputReceiver;
	}

	public setInputReceiver(receiver: IInputReceiver): void {
		this.inputReceiver = receiver;
		this.inputReceiver.inputReceiverInit();
	}

	public setPointerLock(enabled: boolean): void {
		this.pointerLock = enabled;
	}

	public onPointerlockChange(event: MouseEvent): void {
		if (document.pointerLockElement === this.domElement) {
			this.domElement.addEventListener(
				'mousemove',
				this.boundOnMouseMove,
				false,
			);
			this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = true;
		} else {
			this.domElement.removeEventListener(
				'mousemove',
				this.boundOnMouseMove,
				false,
			);
			this.domElement.removeEventListener(
				'mouseup',
				this.boundOnMouseUp,
				false,
			);
			this.isLocked = false;
		}
	}

	public onPointerlockError(event: MouseEvent): void {
		console.error('PointerLockControls: Unable to use Pointer Lock API');
	}

	public onMouseDown(event: MouseEvent): void {
		if (this.pointerLock) {
			this.domElement.requestPointerLock();
		} else {
			this.domElement.addEventListener(
				'mousemove',
				this.boundOnMouseMove,
				false,
			);
			this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
		}

		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, true);
		}
	}

	public onMouseMove(event: MouseEvent): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseMove(
				event,
				event.movementX,
				event.movementY,
			);
		}
	}

	public onMouseUp(event: MouseEvent): void {
		if (!this.pointerLock) {
			this.domElement.removeEventListener(
				'mousemove',
				this.boundOnMouseMove,
				false,
			);
			this.domElement.removeEventListener(
				'mouseup',
				this.boundOnMouseUp,
				false,
			);
		}

		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseButton(
				event,
				'mouse' + event.button,
				false,
			);
		}
	}

	public onKeyDown(event: KeyboardEvent): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleKeyboardEvent(event, event.code, true);
		}
	}

	public onKeyUp(event: KeyboardEvent): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleKeyboardEvent(event, event.code, false);
		}
	}

	public onLeftJoysickDown(
		displacement: THREE.Vector3, 
		code: string,
		pressed: boolean
	): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleLeftJoystickEvent(displacement, code, pressed);
		}
	}

	public onLeftJoysickUp(
		displacement: THREE.Vector3, 
		code: string,
		pressed: boolean
	): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleLeftJoystickEvent(displacement, code, pressed);
		}
	}

	public onRightJoystickDown(
		lookDx: number,
		lookDy: number,
		pressed: boolean
	): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleRightJoystickEvent(lookDx, lookDy, pressed);
		}
	}

	public onRightJoystickUp(
		lookDx: number,
		lookDy: number,
		pressed: boolean
	): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleRightJoystickEvent(lookDx, lookDy, pressed);
		}
    }

	public onMouseWheelMove(event: WheelEvent): void {
		if (this.inputReceiver !== undefined) {
			this.inputReceiver.handleMouseWheel(event, event.deltaY);
		}
	}
}

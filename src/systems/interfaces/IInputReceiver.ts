import { KeyBinding } from '../core/KeyBinding';

export interface IInputReceiver {
	actions: { [action: string]: KeyBinding };

	handleKeyboardEvent(
		event: KeyboardEvent,
		code: string,
		pressed: boolean,
	): void;
	handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void;
	handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void;
	handleMouseWheel(event: WheelEvent, value: number): void;

	handleLeftJoystickEvent?(
		displacement: THREE.Vector3,
		code: string,
		pressed: boolean,
	): void;

	handleRightJoystickEvent?(
		lookDx: number,
		lookDy: number,
		pressed: boolean,
	): void;

	handleDomElementBlurEvent?(event: FocusEvent): void;

	inputReceiverInit(): void;
	inputReceiverUpdate(timeStep: number): void;
}

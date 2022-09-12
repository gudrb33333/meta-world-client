import { Avatar } from '../avatars/Avatar';
import { IInputReceiver } from './IInputReceiver';
import { EntityType } from '../enums/EntityType';
//import { Chair } from '../objects/Chair';

export interface IControllable extends IInputReceiver {
	entityType: EntityType;
	position: THREE.Vector3;
	controllingAvatar: Avatar;

	//triggerAction(actionName: string, value: boolean): void;
	//resetControls(): void;
	allowSleep(value: boolean): void;
	//onInputChange(): void;
	noDirectionPressed(): boolean;
}

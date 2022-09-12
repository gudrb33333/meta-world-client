import * as THREE from 'three';
import * as Utils from '../../core/FunctionLibrary';
import {
	DropIdle,
	DropRolling,
	DropRunning,
	Falling,
	Sprint,
	Walk,
} from './_stateLibrary';
import { Avatar } from '../Avatar';
import { IAvatarState } from '../../interfaces/IAvatarState';

export abstract class AvatarStateBase implements IAvatarState {
	public avatar: Avatar;
	public timer: number;
	public animationLength: any;

	public canFindChairsToEnter: boolean;
	public canEnterChairs: boolean;
	public canLeaveChairs: boolean;

	constructor(avatar: Avatar) {
		this.avatar = avatar;

		this.avatar.velocitySimulator.damping =
			this.avatar.defaultVelocitySimulatorDamping;
		this.avatar.velocitySimulator.mass =
			this.avatar.defaultVelocitySimulatorMass;

		this.avatar.rotationSimulator.damping =
			this.avatar.defaultRotationSimulatorDamping;
		this.avatar.rotationSimulator.mass =
			this.avatar.defaultRotationSimulatorMass;

		this.avatar.arcadeVelocityIsAdditive = false;
		this.avatar.setArcadeVelocityInfluence(1, 0, 1);

		this.canFindChairsToEnter = true;
		this.canEnterChairs = false;
		this.canLeaveChairs = true;

		this.timer = 0;
	}

	public update(timeStep: number): void {
		this.timer += timeStep;
	}

	public onInputChange(): void {
		if (this.canFindChairsToEnter && this.avatar.actions.enter.justPressed) {
			this.avatar.findChairToEnter(true);
		} else if (
			this.canFindChairsToEnter &&
			this.avatar.actions.enter_passenger.justPressed
		) {
			this.avatar.findChairToEnter(false);
		} else if (this.canEnterChairs && this.avatar.chairEntryInstance !== null) {
			if (
				this.avatar.actions.up.justPressed ||
				this.avatar.actions.down.justPressed ||
				this.avatar.actions.left.justPressed ||
				this.avatar.actions.right.justPressed
			) {
				this.avatar.chairEntryInstance = null;
				this.avatar.actions.up.isPressed = false;
			}
		}
	}

	public noDirection(): boolean {
		return (
			!this.avatar.actions.up.isPressed &&
			!this.avatar.actions.down.isPressed &&
			!this.avatar.actions.left.isPressed &&
			!this.avatar.actions.right.isPressed
		);
	}

	public anyDirection(): boolean {
		return (
			this.avatar.actions.up.isPressed ||
			this.avatar.actions.down.isPressed ||
			this.avatar.actions.left.isPressed ||
			this.avatar.actions.right.isPressed
		);
	}

	public fallInAir(): void {
		if (!this.avatar.rayHasHit) {
			this.avatar.setState(new Falling(this.avatar));
		}
	}

	public animationEnded(timeStep: number): boolean {
		if (this.avatar.mixer !== undefined) {
			if (this.animationLength === undefined) {
				console.error(
					this.constructor.name +
						'Error: Set this.animationLength in state constructor!',
				);
				return false;
			} else {
				return this.timer > this.animationLength - timeStep;
			}
		} else {
			return true;
		}
	}

	public setAppropriateDropState(): void {
		if (this.avatar.groundImpactData.velocity.y < -6) {
			this.avatar.setState(new DropRolling(this.avatar));
		} else if (this.anyDirection()) {
			if (this.avatar.groundImpactData.velocity.y < -2) {
				this.avatar.setState(new DropRunning(this.avatar));
			} else {
				if (this.avatar.actions.run.isPressed) {
					this.avatar.setState(new Sprint(this.avatar));
				} else {
					this.avatar.setState(new Walk(this.avatar));
				}
			}
		} else {
			this.avatar.setState(new DropIdle(this.avatar));
		}
	}

	public setAppropriateStartWalkState(): void {
		this.avatar.setState(new Walk(this.avatar));
	}

	protected playAnimation(animName: string, fadeIn: number): void {
		this.animationLength = this.avatar.setAnimation(animName, fadeIn);
	}
}

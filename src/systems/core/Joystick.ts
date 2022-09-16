
import nipplejs from "nipplejs";
import * as THREE from 'three';
import { IUpdatable } from "../interfaces/IUpdatable";
import { World } from "../world/World";
import { InputManager } from "./InputManager";
import './Joystick.css';
  
const ROTATION_SPEED = 10;

export class Joystick implements IUpdatable {
    public updateOrder: number = 10;
    private inputManager: InputManager;
    private world: World;

    private mockJoystickContainer: HTMLDivElement;
    private leftMock: HTMLDivElement;
    private leftMockSmall: HTMLDivElement;
    private rightMock: HTMLDivElement;
    private rightMockSmall: HTMLDivElement;
    private leftTouchZone: HTMLDivElement;
    private rightTouchZone: HTMLDivElement;
    private leftStick: nipplejs.JoystickManager;
    private rightStick: nipplejs.JoystickManager;
    private moving: boolean;
    private rotating: boolean;
    private displacement: THREE.Vector3;
    private lookDy: number;
    private lookDx: number;

    constructor(world: World, inputManager: InputManager){
        this.world = world;
        this.inputManager = inputManager;

        this.onFirstInteraction = this.onFirstInteraction.bind(this);
        this.onMoveJoystickChanged = this.onMoveJoystickChanged.bind(this);
        this.onMoveJoystickEnd = this.onMoveJoystickEnd.bind(this);
        this.onLookJoystickChanged = this.onLookJoystickChanged.bind(this);
        this.onLookJoystickEnd = this.onLookJoystickEnd.bind(this);

        this.mockJoystickContainer = document.createElement("div");
        this.mockJoystickContainer.classList.add('mockJoystickContainer');
        this.leftMock = document.createElement("div");
        this.leftMock.classList.add('mockJoystick');
        this.leftMockSmall = document.createElement("div");
        this.leftMockSmall.classList.add('mockJoystick', 'inner');
        this.leftMock.appendChild(this.leftMockSmall);
        this.mockJoystickContainer.appendChild(this.leftMock);
        this.rightMock = document.createElement("div");
        this.rightMock.classList.add('mockJoystick');
        this.rightMockSmall = document.createElement("div");
        this.rightMockSmall.classList.add('mockJoystick','inner');
        this.rightMock.appendChild(this.rightMockSmall);
        this.mockJoystickContainer.appendChild(this.rightMock);

        this.insertAfter(this.mockJoystickContainer, document.getElementById('main-canvas'));          
        this.createLeftStick();
        this.createRightStick();

        this.moving = false;
        this.rotating = false;
    
        this.displacement = new THREE.Vector3();
        this.lookDy = 0;
        this.lookDx = 0;

        world.registerUpdatable(this);
    }

    private insertAfter(el, referenceEl) {
        referenceEl.parentNode.insertBefore(el, referenceEl.nextSibling);
    }

    private createLeftStick(): void {
        this.leftTouchZone = document.createElement("div");
        this.leftTouchZone.classList.add('touchZone', 'left');
        this.insertAfter(this.leftTouchZone, this.mockJoystickContainer);
        this.leftStick = nipplejs.create({
          mode: "static",
          position: { left: "50%", top: "50%" },
          zone: this.leftTouchZone,
          color: "white",
          fadeTime: 0
        });
        this.leftStick[0].ui.el.style.removeProperty("z-index");
        this.leftStick.on("start", this.onFirstInteraction);
        this.leftStick.on("move", this.onMoveJoystickChanged);
        this.leftStick.on("end", this.onMoveJoystickEnd);
    }

    private createRightStick(): void {
        this.rightTouchZone = document.createElement("div");
        this.rightTouchZone.classList.add('touchZone', 'right');
        this.insertAfter(this.rightTouchZone, this.mockJoystickContainer);
        this.rightStick = nipplejs.create({
          mode: "static",
          position: { left: "50%", top: "50%" },
          zone: this.rightTouchZone,
          color: "white",
          fadeTime: 0
        });
        // nipplejs sets z-index 999 but it makes the joysticks
        // visible even if the scene is hidden for example by
        // preference dialog. So remove z-index.
        this.rightStick[0].ui.el.style.removeProperty("z-index");
        this.rightStick.on("start", this.onFirstInteraction);
        this.rightStick.on("move", this.onLookJoystickChanged);
        this.rightStick.on("end", this.onLookJoystickEnd);
    }

    private onFirstInteraction(): void {
        if (this.leftStick) this.leftStick.off("start", this.onFirstInteraction);
        if (this.rightStick) this.rightStick.off("start", this.onFirstInteraction);
        this.mockJoystickContainer.parentNode &&
          this.mockJoystickContainer.parentNode.removeChild(this.mockJoystickContainer);
    }
    
    private onMoveJoystickChanged(event, joystick): void {
        const angle = joystick.angle.radian;
        const force = joystick.force < 1 ? joystick.force : 1;
        this.displacement.set(Math.cos(angle), 0, -Math.sin(angle)).multiplyScalar(force * 1.85);
        this.displacement.x = -(this.displacement.x)
        this.displacement.z = -(this.displacement.z)
        this.moving = true;
        this.inputManager.onLeftJoysickDown(this.displacement, 'KeyW', this.moving);
    }

    private onMoveJoystickEnd(): void {
        this.moving = false;
        this.displacement.set(0, 0, 0);
        this.inputManager.onLeftJoysickUp(this.displacement, 'KeyW', this.moving);
    }

     
    private onLookJoystickChanged(event, joystick) {
        // Set pitch and yaw angles on right stick move
        const angle = joystick.angle.radian;
        const force = joystick.force < 1 ? joystick.force : 1;
        this.rotating = true;
        this.lookDy = -Math.sin(angle) * force * ROTATION_SPEED;
        this.lookDx = Math.cos(angle) * force * ROTATION_SPEED;
        this.inputManager.onRightJoystickDown(this.lookDx, this.lookDy, this.rotating);
    }

    private onLookJoystickEnd() {
        this.rotating = false;
        this.lookDx = 0;
        this.lookDy = 0;
        this.inputManager.onRightJoystickUp(this.lookDx, this.lookDy, this.rotating);
    }
    
    update(timestep: number, unscaledTimeStep: number): void {
        if( this.rotating){
            this.inputManager.onRightJoystickDown(this.lookDx, this.lookDy, this.rotating);
        }
    }
}

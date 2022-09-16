import * as THREE from 'three';
import * as CANNON from 'cannon';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { CameraOperator } from '../core/CameraOperator';
import { InputManager } from '../core/InputManager';
import * as Utils from '../core/FunctionLibrary';
import { CollisionGroups } from '../enums/CollisionGroups';
import { BoxCollider } from '../physics/colliders/BoxCollider';
import { TrimeshCollider } from '../physics/colliders/TrimeshCollider';
import { LoadingManager } from '../core/LoadingManager';
import { Sky } from './Sky';
import { IUpdatable } from '../interfaces/IUpdatable';
import { AvatarSpawnPoint } from './AvatarSpawnPoint';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { Chair } from '../objects/Chair';
import { Avatar } from '../avatars/Avatar';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { Detector } from '../../lib/utils/Detector';
import { Stats } from '../../lib/utils/Stats';
import * as GUI from '../../lib/utils/dat.gui';
import { CannonDebugRenderer } from '../../lib/cannon/CannonDebugRenderer';
import * as _ from 'lodash';
import { UIManager } from '../core/UIManager';
import { ObjectSpawnPoint } from './ObjectSpawnPoint';
import { PhoenixAdapter } from '../core/PhoenixAdapter';
import { MediasoupAdapter } from '../core/MediasoupAdapter';
import { Joystick } from '../core/Joystick';

export class World {
    private requestAnimationFrameId;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private cameraOperator: CameraOperator;
	private sky: Sky;
    private composer: EffectComposer;
    private graphicsWorld: THREE.Scene;
	private physicsWorld: CANNON.World;
	private physicsFrameRate: number;
	private physicsFrameTime: number;
	private physicsMaxPrediction: number;
    private clock: THREE.Clock;
	private renderDelta: number;
	private logicDelta: number;
	private requestDelta: number;
	private sinceLastFrame: number;
	private justRendered: boolean;
    private params: WorldParams;
    private timeScaleTarget = 1;

	private inputManager: InputManager;

	private spawnPoints: ISpawnPoint[] = [];
	private userAvatar: Avatar;
	private avatars: Avatar[] = [];
	private avatarMap = new Map<string, Avatar>();
	private chairs: Chair[] = [];

	private stats: Stats;
	private scenarioGUIFolder: GUI;
	private cannonDebugRenderer: CannonDebugRenderer;

	private phoenixAdapter: PhoenixAdapter;
	private mediasoupAdapter: MediasoupAdapter;

	public updatables: IUpdatable[] = [];

	constructor(worldScenePath?: string) {
		const scope = this;

		// Renderer
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.0;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.BasicShadowMap;

		// Canvas
		this.renderer.domElement.id = 'main-canvas';
		document.body.appendChild(this.renderer.domElement);

		// Auto window resize
		function onWindowResize(): void {
			scope.camera.aspect = window.innerWidth / window.innerHeight;
			scope.camera.updateProjectionMatrix();
			scope.renderer.setSize(window.innerWidth, window.innerHeight);
			fxaaPass.uniforms['resolution'].value.set(
				1 / (window.innerWidth * pixelRatio),
				1 / (window.innerHeight * pixelRatio),
			);
			scope.composer.setSize(
				window.innerWidth * pixelRatio,
				window.innerHeight * pixelRatio,
			);
		}

		const maxResolution = {
			width: screen.width * window.devicePixelRatio,
			height: screen.height * window.devicePixelRatio,
		}


		function calculateRendererSize (canvasRect, maxResolution) {
 			// canvasRect values are CSS pixels based while
 			// maxResolution values are physical pixels based (CSS pixels * pixel ratio).
 			// Convert maxResolution values to CSS pixels based.
 			const pixelRatio = window.devicePixelRatio;
 			const maxWidth = maxResolution.width / pixelRatio;
 			const maxHeight = maxResolution.height / pixelRatio;

			if (canvasRect.width <= maxWidth && canvasRect.height <= maxHeight) {
				return canvasRect;
			}
			
			const conversionRatio = Math.min(maxWidth / canvasRect.width, maxHeight / canvasRect.height);
			
			return {
				width: Math.round(canvasRect.width * conversionRatio),
				height: Math.round(canvasRect.height * conversionRatio)
			};
		}

		const observer = new ResizeObserver(entries => {
			//TODO: 가로,세로 바꿀때 해상도 찌그러지는거 해결해야함.
			this.stopRendering();
			
			const canvasRect = entries[0].contentRect;

			const rendererSize = calculateRendererSize(canvasRect, maxResolution);

			const canvas = document.getElementById('main-canvas');
			canvas.style.width = canvasRect.width + "px";
			canvas.style.height = canvasRect.height + "px";

			scope.renderer.setSize(rendererSize.width, rendererSize.height, false);

			fxaaPass.uniforms['resolution'].value.set(
				1 / (window.innerWidth * pixelRatio),
				1 / (window.innerHeight * pixelRatio),
			);

			scope.camera.aspect = rendererSize.width / rendererSize.height;
			scope.camera.updateProjectionMatrix();

			scope.render(this);

		});
		  
		observer.observe(document.body);


		//window.addEventListener('resize', onWindowResize, false);

		// Three.js scene
		this.graphicsWorld = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			80,
			window.innerWidth / window.innerHeight,
			0.1,
			1010,
		);

		// Passes
		const renderPass = new RenderPass(this.graphicsWorld, this.camera);
		const fxaaPass = new ShaderPass(FXAAShader);

		// FXAA
		const pixelRatio = this.renderer.getPixelRatio();
		fxaaPass.material['uniforms'].resolution.value.x =
			1 / (window.innerWidth * pixelRatio);
		fxaaPass.material['uniforms'].resolution.value.y =
			1 / (window.innerHeight * pixelRatio);

		// Composer
		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(renderPass);
		this.composer.addPass(fxaaPass);

		// Physics
		this.physicsWorld = new CANNON.World();
		this.physicsWorld.gravity.set(0, -9.81, 0);
		this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
		this.physicsWorld.solver.iterations = 10;
		this.physicsWorld.allowSleep = true;

		this.physicsFrameRate = 60;
		this.physicsFrameTime = 1 / this.physicsFrameRate;
		this.physicsMaxPrediction = this.physicsFrameRate;

		// RenderLoop
		this.clock = new THREE.Clock();
		this.renderDelta = 0;
		this.logicDelta = 0;
		this.sinceLastFrame = 0;
		this.justRendered = false;

		// Stats (FPS, Frame time, Memory)
		this.stats = Stats();
		// Create right panel GUI
		this.createParamsGUI(scope);

		// Initialization
		this.inputManager = new InputManager(this, this.renderer.domElement);
		this.cameraOperator = new CameraOperator(
			this,
			this.camera,
			this.params.Mouse_Sensitivity,
		);
		this.sky = new Sky(this);
		new Joystick(this, this.inputManager);

        // Load scene if path is supplied
		if (worldScenePath !== undefined) {
            const loadingManager = new LoadingManager(this);
			const avatarLoadingManager = new LoadingManager(this);

            loadingManager.onFinishedCallback = async () => {
                this.update(1, 1);
				this.setTimeScale(1);

				const profile = {
					avatar_url: localStorage.getItem('avatar_url'),
					avatar_name: localStorage.getItem('avatar_name'),
				};
				this.phoenixAdapter = new PhoenixAdapter(
					this,
					process.env.PHOENIX_SERVER_URL,
					process.env.PHOENIX_CHANNER_TOPIC,
					profile,
				);
				await this.phoenixAdapter.phoenixSocketConnect();
				await this.phoenixAdapter.phoenixChannelJoin();

				this.phoenixAdapter.onJoin(avatarLoadingManager);
				this.phoenixAdapter.onLeave();
				this.phoenixAdapter.onSync();

				this.mediasoupAdapter = new MediasoupAdapter(
					this,
					process.env.MEDIASOUP_SERVER_URL,
				);
            }

            loadingManager.loadGLTF(worldScenePath, (gltf) => {
				this.loadScene(loadingManager, gltf);
			});
        }
		
		this.render(this);
    }

    public loadScene(loadingManager: LoadingManager, gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.hasOwnProperty('userData')) {
				if (child.type === 'Mesh') {
					Utils.setupMeshProperties(child);
					this.sky.csm.setupMaterial(child.material);
				}

				if (child.userData.hasOwnProperty('data')) {
					if (child.userData.data === 'physics') {
						if (child.userData.hasOwnProperty('type')) {
							// Convex doesn't work! Stick to boxes!
							if (child.userData.type === 'box') {
								const phys = new BoxCollider({
									size: new THREE.Vector3(
										child.scale.x,
										child.scale.y,
										child.scale.z,
									),
								});
								phys.body.position.copy(Utils.cannonVector(child.position));
								phys.body.quaternion.copy(Utils.cannonQuat(child.quaternion));
								phys.body.computeAABB();

								phys.body.shapes.forEach((shape) => {
									shape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
								});

								this.physicsWorld.addBody(phys.body);
							} else if (child.userData.type === 'trimesh') {
								const phys = new TrimeshCollider(child, {});
								this.physicsWorld.addBody(phys.body);
							}

							child.visible = false;
						}
					}

					if (child.userData.data === 'spawn') {
						if (child.userData.type === 'chair') {
							const sp = new ObjectSpawnPoint(child);

							if (child.userData.hasOwnProperty('type')) {
								sp.setType(child.userData.type);
							}
	
							this.spawnPoints.push(sp);
						} else if (child.userData.type === 'player') {
							const sp = new AvatarSpawnPoint(child);
							this.spawnPoints.push(sp);
						}
					}

				}
			}
		});
		
		this.graphicsWorld.add(gltf.scene);

		this.spawnPoints.forEach((sp) => {
			sp.spawn(loadingManager, this);
		});
    }

	public setTimeScale(value: number): void {
		this.params.Time_Scale = value;
		this.timeScaleTarget = value;
	}

	public add(worldEntity: IWorldEntity): void {
		worldEntity.addToWorld(this);
		this.registerUpdatable(worldEntity);
	}


	public registerUpdatable(registree: IUpdatable): void {
		this.updatables.push(registree);
		this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1));
	}

	public remove(worldEntity: IWorldEntity): void {
		worldEntity.removeFromWorld(this);
		this.unregisterUpdatable(worldEntity);
	}

	public unregisterUpdatable(registree: IUpdatable): void {
		_.pull(this.updatables, registree);
	}

	public clearEntities(): void {
		for (let i = 0; i < this.avatars.length; i++) {
			this.remove(this.avatars[i]);
			i--;
		}

		for (let i = 0; i < this.chairs.length; i++) {
			this.remove(this.chairs[i]);
			i--;
		}
	}

	private createParamsGUI(scope: World): void {
		this.params = {
			Pointer_Lock: true,
			Mouse_Sensitivity: 0.3,
			Time_Scale: 1,
			Shadows: true,
			FXAA: true,
			Debug_Physics: false,
			Debug_FPS: false,
			Sun_Elevation: 50,
			Sun_Rotation: 145,
		};

		const gui = new GUI.GUI();

		// Scenario
		this.scenarioGUIFolder = gui.addFolder('Scenarios');
		this.scenarioGUIFolder.open();

		// World
		const worldFolder = gui.addFolder('World');
		worldFolder
			.add(this.params, 'Time_Scale', 0, 1)
			.listen()
			.onChange((value) => {
				scope.timeScaleTarget = value;
			});
		worldFolder
			.add(this.params, 'Sun_Elevation', 0, 180)
			.listen()
			.onChange((value) => {
				scope.sky.phi = value;
			});
		worldFolder
			.add(this.params, 'Sun_Rotation', 0, 360)
			.listen()
			.onChange((value) => {
				scope.sky.theta = value;
			});

		// Input
		const settingsFolder = gui.addFolder('Settings');
		settingsFolder.add(this.params, 'FXAA');
		settingsFolder.add(this.params, 'Shadows').onChange((enabled) => {
			if (enabled) {
				this.sky.csm.lights.forEach((light) => {
					light.castShadow = true;
				});
			} else {
				this.sky.csm.lights.forEach((light) => {
					light.castShadow = false;
				});
			}
		});
		settingsFolder.add(this.params, 'Pointer_Lock').onChange((enabled) => {
			scope.inputManager.setPointerLock(enabled);
		});
		settingsFolder
			.add(this.params, 'Mouse_Sensitivity', 0, 1)
			.onChange((value) => {
				scope.cameraOperator.setSensitivity(value, value * 0.8);
			});
		settingsFolder.add(this.params, 'Debug_Physics').onChange((enabled) => {
			if (enabled) {
				this.cannonDebugRenderer = new CannonDebugRenderer(
					this.graphicsWorld,
					this.physicsWorld,
				);
			} else {
				this.cannonDebugRenderer.clearMeshes();
				this.cannonDebugRenderer = undefined;
			}

			scope.avatars.forEach((avatar) => {
				avatar.getRaycastBox().visible = enabled;
			});
		});
		settingsFolder.add(this.params, 'Debug_FPS').onChange((enabled) => {
			UIManager.setFPSVisible(enabled);
		});

		gui.open();
	}

	public getParams(): WorldParams{
		return this.params;
	}

	public getCamera(): THREE.PerspectiveCamera{
		return this.camera;
	}

	public getCameraOperator(): CameraOperator{
		return this.cameraOperator;
	}

	public getInputManager(): InputManager{
		return this.inputManager;
	}

	public getPhysicsFrameRate(): number{
		return this.physicsFrameRate;
	}

	public getSky(): Sky{
		return this.sky;
	}

	public getGraphicsWorld(): THREE.Scene{
		return this.graphicsWorld;
	}

	public getPhysicsWorld(): CANNON.World{
		return this.physicsWorld;
	}
	
	public setUserAvatar(sessionId: string) {
		this.userAvatar = this.avatars[0];
		this.userAvatar.setSessionId(sessionId);
		this.avatarMap.set(sessionId, this.userAvatar);
	}

	public getUserAvatar(): Avatar {
		return this.userAvatar;
	}

	public getAvatars(): Avatar[] {
		return this.avatars;
	}

	public getAvatarMap(): Map<string, Avatar> {
		return this.avatarMap;
	}

	public getTargetAvatar(sessionId: string): Avatar {
		return this.avatarMap.get(sessionId);
	}


	public getChairs(): Chair[]{
		return this.chairs;
	}

	// Update
	// Handles all logic updates.
	public update(timeStep: number, unscaledTimeStep: number): void {
		this.updatePhysics(timeStep);

		// Update registred objects
		this.updatables.forEach((entity) => {
			entity.update(timeStep, unscaledTimeStep);
		});

		// Lerp time scale
		this.params.Time_Scale = THREE.MathUtils.lerp(
			this.params.Time_Scale,
			this.timeScaleTarget,
			0.2,
		);

		// Physics debug
		if (this.params.Debug_Physics) this.cannonDebugRenderer.update();
	}

	public updatePhysics(timeStep: number): void {
		// Step the physics world
		this.physicsWorld.step(this.physicsFrameTime, timeStep);
	}

	public isOutOfBounds(position: CANNON.Vec3): boolean {
		const inside =
			position.x > -211.882 &&
			position.x < 211.882 &&
			position.z > -169.098 &&
			position.z < 153.232 &&
			position.y > 0.107;
		const belowSeaLevel = position.y < 14.989;

		return !inside && belowSeaLevel;
	}

	public outOfBoundsRespawn(body: CANNON.Body, position?: CANNON.Vec3): void {
		const newPos = position || new CANNON.Vec3(0, 16, 0);
		const newQuat = new CANNON.Quaternion(0, 0, 0, 1);

		body.position.copy(newPos);
		body.interpolatedPosition.copy(newPos);
		body.quaternion.copy(newQuat);
		body.interpolatedQuaternion.copy(newQuat);
		body.velocity.setZero();
		body.angularVelocity.setZero();
	}

	public stopRendering() {
		cancelAnimationFrame(this.requestAnimationFrameId);
	}

	/**
	 * Rendering loop.
	 * Implements fps limiter and frame-skipping
	 * Calls world's "update" function before rendering.
	 * @param {World} world
	 */
	public render(world: World): void {
		this.requestDelta = this.clock.getDelta();

		this.requestAnimationFrameId = requestAnimationFrame(() => {
			world.render(world);
		});

		// Getting timeStep
		const unscaledTimeStep =
			this.requestDelta + this.renderDelta + this.logicDelta;
		let timeStep = unscaledTimeStep * this.params.Time_Scale;
		timeStep = Math.min(timeStep, 1 / 30); // min 30 fps

		// Logic
		world.update(timeStep, unscaledTimeStep);

		// Measuring logic time
		this.logicDelta = this.clock.getDelta();

		// Frame limiting
		const interval = 1 / 60;
		this.sinceLastFrame +=
			this.requestDelta + this.renderDelta + this.logicDelta;
		this.sinceLastFrame %= interval;

		// Stats end
		this.stats.end();
		this.stats.begin();

		// Actual rendering with a FXAA ON/OFF switch
		if (this.params.FXAA) this.composer.render();
		else this.renderer.render(this.graphicsWorld, this.camera);

		// Measuring render time
		this.renderDelta = this.clock.getDelta();
	}
}

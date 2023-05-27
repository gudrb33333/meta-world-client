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
import { Avatar } from '../avatars/Avatar';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { Stats } from '../../lib/utils/Stats';
import * as GUI from '../../lib/utils/dat.gui';
import { CannonDebugRenderer } from '../../lib/cannon/CannonDebugRenderer';
import * as _ from 'lodash';
import { UIManager } from '../core/UIManager';
import { ObjectSpawnPoint } from './ObjectSpawnPoint';
import { PhoenixAdapter } from '../core/PhoenixAdapter';
import { MediasoupAdapter } from '../core/MediasoupAdapter';
import checkIsMobile, { isIOS } from '../../utils/isMobile';
import { WorldObject } from '../objects/WorldObject';
import { Light } from './Light';

import { Bloom } from '../core/Bloom';
import { LocalVideoScreen } from '../core/LocalVideoScreen';
import { AudioFrequencyAnalyser } from '../core/AudioFrequencyAnalyser';

export interface WorldParams {
	Pointer_Lock: boolean;
	Mouse_Sensitivity: number;
	Time_Scale: number;
	Shadows: boolean;
	FXAA: boolean;
	Debug_Physics: boolean;
	Debug_FPS: boolean;
	Sun_Elevation: number;
	Sun_Rotation: number;
}

export class World {
	private _requestAnimationFrameId;
	private _renderer: THREE.WebGLRenderer;
	private _renderPass: RenderPass;
	private _camera: THREE.PerspectiveCamera;
	private _cameraOperator: CameraOperator;
	private _sky: Sky;
	private _light: Light;
	private _composer: EffectComposer;
	private _graphicsWorld: THREE.Scene;
	private _physicsWorld: CANNON.World;
	private _physicsFrameRate: number;
	private _physicsFrameTime: number;
	private _physicsMaxPrediction: number;
	private _clock: THREE.Clock;
	private _renderDelta: number;
	private _logicDelta: number;
	private _requestDelta: number;
	private _sinceLastFrame: number;
	private _justRendered: boolean;
	private _params: WorldParams;
	private _timeScaleTarget = 1;
	private _avatarAdjustValue: number;
	private _bloom: Bloom;
	private _localVideoSceen: LocalVideoScreen;
	private _localVideoSrc: string;

	private _inputManager: InputManager;

	private _spawnPoints: ISpawnPoint[] = [];
	private _userAvatar: Avatar;
	private _avatars: Avatar[] = [];
	private _avatarMap = new Map<string, Avatar>();
	private _worldObjects: WorldObject[] = [];

	private _stats: Stats;
	private _scenarioGUIFolder: GUI;
	private _cannonDebugRenderer: CannonDebugRenderer;

	private _phoenixAdapter: PhoenixAdapter;
	private _mediasoupAdapter: MediasoupAdapter;

	private _audioFrequencyAnalyser: AudioFrequencyAnalyser;
	private _needAudioFrequencyData: boolean;

	public updatables: IUpdatable[] = [];

	constructor(options: {
		worldScenePath: string;
		roomName: string;
		avatarAdjustValue: number;
		lightValue: number;
		needBloom: boolean;
		localVideoSrc: string;
		needAudioFrequencyData: boolean;
	}) {
		const scope = this;

		this._localVideoSrc = options.localVideoSrc;
		this._needAudioFrequencyData = options.needAudioFrequencyData;

		// Renderer
		this._renderer = new THREE.WebGLRenderer();
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(window.innerWidth, window.innerHeight);
		this._renderer.toneMapping = THREE.ReinhardToneMapping;
		this._renderer.toneMappingExposure = 1;
		this._renderer.shadowMap.enabled = false;
		this._renderer.shadowMap.type = THREE.BasicShadowMap;

		// Canvas
		this._renderer.domElement.id = 'main-canvas';
		this._renderer.domElement.tabIndex = 1;
		document.body.appendChild(this._renderer.domElement);

		// Auto window resize
		function onWindowResize(): void {
			scope._camera.aspect = window.innerWidth / window.innerHeight;
			scope._camera.updateProjectionMatrix();
			scope._renderer.setSize(window.innerWidth, window.innerHeight);
			fxaaPass.uniforms['resolution'].value.set(
				1 / (window.innerWidth * pixelRatio),
				1 / (window.innerHeight * pixelRatio),
			);
			scope._composer.setSize(
				window.innerWidth * pixelRatio,
				window.innerHeight * pixelRatio,
			);
		}

		const maxResolution = {
			width: screen.width * window.devicePixelRatio,
			height: screen.height * window.devicePixelRatio,
		};

		const isNaturalOrientation = () => {
			return getAngle() % 180 === 0;
		};

		const getAngle = () => {
			return typeof ScreenOrientation !== 'undefined'
				? screen.orientation.angle
				: window.orientation;
		};

		const getMaxResolutionWidth = () => {
			const width = isNaturalOrientation()
				? maxResolution.width
				: maxResolution.height;
			return width !== undefined ? width : getDefaultMaxResolutionWidth();
		};

		const getDefaultMaxResolutionWidth = () => {
			return getScreenWidth();
		};

		const getDefaultMaxResolutionHeight = () => {
			return getScreenHeight();
		};

		const getMaxResolutionHeight = () => {
			const height = isNaturalOrientation()
				? maxResolution.height
				: maxResolution.width;
			return height !== undefined ? height : getDefaultMaxResolutionHeight();
		};

		// Return the screen width in CSS pixels based on the current screen orientation
		const getScreenWidth = () => {
			// Is seems screen.width value is based on the natural screen orientation on iOS
			// while it is based on the current screen orientation on Android (and other devices?).
			if (isIOS) {
				return isNaturalOrientation() ? screen.width : screen.height;
			}
			return screen.width;
		};

		const getScreenHeight = () => {
			// Is seems screen.height value is based on the natural screen orientation on iOS
			// while it is based on the current screen orientation on Android (and other devices?).
			if (isIOS) {
				return isNaturalOrientation() ? screen.height : screen.width;
			}
			return screen.height;
		};

		function calculateRendererSize(canvasRect, maxResolution) {
			// canvasRect values are CSS pixels based while
			// maxResolution values are physical pixels based (CSS pixels * pixel ratio).
			// Convert maxResolution values to CSS pixels based.
			const pixelRatio = window.devicePixelRatio;
			const maxWidth = maxResolution.width / pixelRatio;
			const maxHeight = maxResolution.height / pixelRatio;

			if (canvasRect.width <= maxWidth && canvasRect.height <= maxHeight) {
				return canvasRect;
			}

			const conversionRatio = Math.min(
				maxWidth / canvasRect.width,
				maxHeight / canvasRect.height,
			);

			return {
				width: Math.round(canvasRect.width * conversionRatio),
				height: Math.round(canvasRect.height * conversionRatio),
			};
		}

		const observer = new ResizeObserver((entries) => {
			//TODO: 가로,세로 바꿀때 해상도 찌그러지는거 해결해야함.
			this.stopRendering();

			const canvasRect = entries[0].contentRect;

			maxResolution.width = getMaxResolutionWidth();
			maxResolution.height = getMaxResolutionHeight();

			const rendererSize = calculateRendererSize(canvasRect, maxResolution);

			const canvas = document.getElementById('main-canvas');
			canvas.style.width = canvasRect.width + 'px';
			canvas.style.height = canvasRect.height + 'px';

			scope._renderer.setSize(rendererSize.width, rendererSize.height, false);

			fxaaPass.uniforms['resolution'].value.set(
				1 / (window.innerWidth * pixelRatio),
				1 / (window.innerHeight * pixelRatio),
			);

			scope._camera.aspect = rendererSize.width / rendererSize.height;
			scope._camera.updateProjectionMatrix();

			scope.render(this);
		});

		observer.observe(document.body);

		//window.addEventListener('resize', onWindowResize, false);

		// Three.js scene
		this._graphicsWorld = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(
			80,
			window.innerWidth / window.innerHeight,
			0.1,
			1010,
		);

		// Passes
		this._renderPass = new RenderPass(this._graphicsWorld, this._camera);
		const fxaaPass = new ShaderPass(FXAAShader);

		// FXAA
		const pixelRatio = this._renderer.getPixelRatio();
		fxaaPass.material['uniforms'].resolution.value.x =
			1 / (window.innerWidth * pixelRatio);
		fxaaPass.material['uniforms'].resolution.value.y =
			1 / (window.innerHeight * pixelRatio);

		// Composer
		this._composer = new EffectComposer(this._renderer);
		this._composer.addPass(this._renderPass);
		this._composer.addPass(fxaaPass);

		if (options.needBloom) {
			this._bloom = new Bloom(this);
		}

		// Physics
		this._physicsWorld = new CANNON.World();
		this._physicsWorld.gravity.set(0, -9.81, 0);
		this._physicsWorld.broadphase = new CANNON.SAPBroadphase(
			this._physicsWorld,
		);
		this._physicsWorld.solver.iterations = 10;
		this._physicsWorld.allowSleep = true;

		this._physicsFrameRate = 60;
		this._physicsFrameTime = 1 / this._physicsFrameRate;
		this._physicsMaxPrediction = this._physicsFrameRate;

		// RenderLoop
		this._clock = new THREE.Clock();
		this._renderDelta = 0;
		this._logicDelta = 0;
		this._sinceLastFrame = 0;
		this._justRendered = false;

		// Stats (FPS, Frame time, Memory)
		this._stats = Stats();
		// Create right panel GUI
		this.createParamsGUI(scope);

		// Initialization
		this._inputManager = new InputManager(this, this._renderer.domElement);
		this._cameraOperator = new CameraOperator(
			this,
			this._camera,
			this._params.Mouse_Sensitivity,
			this._params.Mouse_Sensitivity * 0.8,
			options.avatarAdjustValue,
		);

		this._light = new Light(this, options.lightValue);

		const loader = new THREE.TextureLoader();
		const texture = loader.load('assets/AdobeStock_191213422_11zon.jpeg');
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearFilter;

		const shader = THREE.ShaderLib.equirect;
		const material = new THREE.ShaderMaterial({
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			depthWrite: false,
			side: THREE.BackSide,
		});
		material.uniforms.tEquirect.value = texture;
		const sphere = new THREE.SphereBufferGeometry(100, 100, 100);
		const bgMesh = new THREE.Mesh(sphere, material);
		bgMesh.position.set(0, 0, 0);
		this._graphicsWorld.add(bgMesh);

		// Load scene if path is supplied
		if (options.worldScenePath !== undefined) {
			this._avatarAdjustValue = options.avatarAdjustValue;
			const loadingManager = new LoadingManager(this);
			const avatarLoadingManager = new LoadingManager(this);

			loadingManager.onFinishedCallback = async () => {
				this.update(1, 1);
				this.setTimeScale(1);
				const profile = {
					avatar_url: '',
					avatar_name: '',
				};

				profile.avatar_url = sessionStorage.getItem('avatar_url');
				profile.avatar_name = sessionStorage.getItem('avatar_name');

				const qs = new URLSearchParams(location.search);
				if (qs.has('phoenix-host')) {
					const phoenix = `wss://${qs.get('phoenix-host')}/socket`;
					console.log(phoenix);

					this._phoenixAdapter = new PhoenixAdapter(
						this,
						phoenix,
						'room:' + options.roomName,
						profile,
					);
				} else {
					this._phoenixAdapter = new PhoenixAdapter(
						this,
						process.env.PHOENIX_SERVER_URL,
						'room:' + options.roomName,
						profile,
					);
					console.log(process.env.PHOENIX_SERVER_URL);
				}

				await this._phoenixAdapter.phoenixSocketConnect();
				await this._phoenixAdapter.phoenixChannelJoin();

				this._phoenixAdapter.onJoin(avatarLoadingManager);
				this._phoenixAdapter.onLeave();
				this._phoenixAdapter.onSync();

				this._mediasoupAdapter = new MediasoupAdapter(
					this,
					process.env.MEDIASOUP_SERVER_URL,
					options.roomName,
				);
			};

			loadingManager.loadGLTF(options.worldScenePath, (gltf) => {
				this.loadScene(loadingManager, gltf);
			});
		}

		this.render(this);
	}

	public loadScene(loadingManager: LoadingManager, gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.material) {
				if (
					child.material.name === 'pink_bloom' ||
					child.material.name === 'iceblue_bloom' ||
					child.material.name === 'yellow_bloom_highyy' ||
					child.material.name === 'yellow_bloom_low' ||
					child.material.name === 'turkuaz_bloom' ||
					child.material.name === 'orange_bloom' ||
					child.material.name === 'purple_bloom' ||
					child.material.name === 'yellow_bloom_high'
				) {
					child.layers.enable(1);
				} else {
					child.material.dispose();
				}
			}

			if (child.hasOwnProperty('userData')) {
				if (child.type === 'Mesh') {
					Utils.setupMeshProperties(child);
					//this.sky.csm.setupMaterial(child.material);
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

								this._physicsWorld.addBody(phys.body);
							} else if (child.userData.type === 'trimesh') {
								const phys = new TrimeshCollider(child, {});
								this._physicsWorld.addBody(phys.body);
							}

							child.visible = false;
						}
					}

					if (child.userData.data === 'spawn') {
						if (child.userData.type === 'chair') {
							const sp = new ObjectSpawnPoint(child);

							if (child.userData.hasOwnProperty('type')) {
								sp.type = child.userData.type;
							}

							this._spawnPoints.push(sp);
						} else if (child.userData.type === 'clothing') {
							const sp = new ObjectSpawnPoint(child);

							if (child.userData.hasOwnProperty('type')) {
								sp.type = child.userData.type;
							}

							this._spawnPoints.push(sp);
						} else if (child.userData.type === 'player') {
							const sp = new AvatarSpawnPoint(child);
							this._spawnPoints.push(sp);
						}
					}
				}
			}
		});

		this._graphicsWorld.add(gltf.scene);

		this._spawnPoints.forEach((sp) => {
			sp.spawn(loadingManager, this);
		});
	}

	public setTimeScale(value: number): void {
		this._params.Time_Scale = value;
		this._timeScaleTarget = value;
	}

	public setUserAvatarAndAvatarMap(sessionId: string) {
		this._userAvatar = this.avatars[0];
		this._userAvatar.sessionId = sessionId;
		this._avatarMap.set(sessionId, this._userAvatar);
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
		for (let i = 0; i < this._avatars.length; i++) {
			this.remove(this._avatars[i]);
			i--;
		}

		for (let i = 0; i < this._worldObjects.length; i++) {
			this.remove(this._worldObjects[i]);
			i--;
		}
	}

	private createParamsGUI(scope: World): void {
		this._params = {
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
		this._scenarioGUIFolder = gui.addFolder('Scenarios');
		this._scenarioGUIFolder.open();

		// World
		const worldFolder = gui.addFolder('World');
		worldFolder
			.add(this._params, 'Time_Scale', 0, 1)
			.listen()
			.onChange((value) => {
				scope._timeScaleTarget = value;
			});
		worldFolder
			.add(this._params, 'Sun_Elevation', 0, 180)
			.listen()
			.onChange((value) => {
				scope._sky.phi = value;
			});
		worldFolder
			.add(this._params, 'Sun_Rotation', 0, 360)
			.listen()
			.onChange((value) => {
				scope._sky.theta = value;
			});

		// Input
		const settingsFolder = gui.addFolder('Settings');
		settingsFolder.add(this._params, 'FXAA');
		// settingsFolder.add(this.params, 'Shadows').onChange((enabled) => {
		// 	if (enabled) {
		// 		this.sky.csm.lights.forEach((light) => {
		// 			light.castShadow = true;
		// 		});
		// 	} else {
		// 		this.sky.csm.lights.forEach((light) => {
		// 			light.castShadow = false;
		// 		});
		// 	}
		// });
		settingsFolder.add(this._params, 'Pointer_Lock').onChange((enabled) => {
			scope._inputManager.setPointerLock(enabled);
		});
		settingsFolder
			.add(this._params, 'Mouse_Sensitivity', 0, 1)
			.onChange((value) => {
				scope._cameraOperator.setSensitivity(value, value * 0.8);
			});
		settingsFolder.add(this._params, 'Debug_Physics').onChange((enabled) => {
			if (enabled) {
				this._cannonDebugRenderer = new CannonDebugRenderer(
					this._graphicsWorld,
					this._physicsWorld,
				);
			} else {
				this._cannonDebugRenderer.clearMeshes();
				this._cannonDebugRenderer = undefined;
			}

			scope._avatars.forEach((avatar) => {
				avatar.raycastBox.visible = enabled;
			});
		});
		settingsFolder.add(this._params, 'Debug_FPS').onChange((enabled) => {
			UIManager.setFPSVisible(enabled);
		});

		gui.open();
	}

	public findTargetAvatar(sessionId: string): Avatar {
		return this._avatarMap.get(sessionId);
	}

	public disconnectPhoenixAdapter(): void {
		this._phoenixAdapter.disconnect();
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
		this._params.Time_Scale = THREE.MathUtils.lerp(
			this._params.Time_Scale,
			this._timeScaleTarget,
			0.2,
		);

		// Physics debug
		if (this._params.Debug_Physics) this._cannonDebugRenderer.update();
	}

	public updatePhysics(timeStep: number): void {
		// Step the physics world
		this._physicsWorld.step(this._physicsFrameTime, timeStep);
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

	public initLocalVideoSceen(): void {
		if (this._localVideoSrc != null) {
			this._localVideoSceen = new LocalVideoScreen(this, this._localVideoSrc);
		}
	}

	public playLocalVideoSceen(): void {
		if (this._localVideoSrc != null) {
			this._localVideoSceen.localVideo.play();
		}
	}

	public initAudioFrequencyAnalyser(): void {
		if (this._needAudioFrequencyData) {
			this._audioFrequencyAnalyser = new AudioFrequencyAnalyser(this);
		}
	}

	public stopRendering() {
		cancelAnimationFrame(this._requestAnimationFrameId);
	}

	/**
	 * Rendering loop.
	 * Implements fps limiter and frame-skipping
	 * Calls world's "update" function before rendering.
	 * @param {World} world
	 */
	public render(world: World): void {
		if (this._localVideoSceen != null) {
			if (
				this._localVideoSceen.localVideo &&
				this._localVideoSceen.localVideo.readyState ===
					this._localVideoSceen.localVideo.HAVE_ENOUGH_DATA
			) {
				this._localVideoSceen.localVideoImageContext.drawImage(
					this._localVideoSceen.localVideo,
					0,
					0,
				);
				if (this._localVideoSceen.localVideoTexture)
					this._localVideoSceen.localVideoTexture.needsUpdate = true;
			}
		}

		if (this._audioFrequencyAnalyser != null) {
			const sumOfFrequencyData =
				this._audioFrequencyAnalyser.getSumOfFrequencyData();
			this._bloom.changerBloomStrength(sumOfFrequencyData);
			this.renderer.toneMappingExposure = sumOfFrequencyData + 1.3;
		}

		this._requestDelta = this._clock.getDelta();

		this._requestAnimationFrameId = requestAnimationFrame(() => {
			world.render(world);
		});

		// Getting timeStep
		const unscaledTimeStep =
			this._requestDelta + this._renderDelta + this._logicDelta;
		let timeStep = unscaledTimeStep * this._params.Time_Scale;
		timeStep = Math.min(timeStep, 1 / 30); // min 30 fps

		// Logic
		world.update(timeStep, unscaledTimeStep);

		// Measuring logic time
		this._logicDelta = this._clock.getDelta();

		// Frame limiting
		const interval = 1 / 60;
		this._sinceLastFrame +=
			this._requestDelta + this._renderDelta + this._logicDelta;
		this._sinceLastFrame %= interval;

		// Stats end
		this._stats.end();
		this._stats.begin();

		// Actual rendering with a FXAA ON/OFF switch
		if (this._params.FXAA) this._composer.render();
		else this._renderer.render(this._graphicsWorld, this._camera);

		if (this._bloom != null) {
			this._bloom.renderBloomCompose();
			this._bloom.renderFinalCompose();
		}

		// Measuring render time
		this._renderDelta = this._clock.getDelta();
	}

	//getter,setter
	get params(): WorldParams {
		return this._params;
	}

	get camera(): THREE.PerspectiveCamera {
		return this._camera;
	}

	get cameraOperator(): CameraOperator {
		return this._cameraOperator;
	}

	get inputManager(): InputManager {
		return this._inputManager;
	}

	get physicsFrameRate(): number {
		return this._physicsFrameRate;
	}

	get sky(): Sky {
		return this._sky;
	}

	get graphicsWorld(): THREE.Scene {
		return this._graphicsWorld;
	}

	get physicsWorld(): CANNON.World {
		return this._physicsWorld;
	}

	get avatars(): Avatar[] {
		return this._avatars;
	}

	get userAvatar(): Avatar {
		return this._userAvatar;
	}

	get worldObjects(): WorldObject[] {
		return this._worldObjects;
	}

	get mediasoupAdapter() {
		return this._mediasoupAdapter;
	}

	get avatarMap(): Map<string, Avatar> {
		return this._avatarMap;
	}

	get avatarAdjustValue(): number {
		return this._avatarAdjustValue;
	}

	get renderer(): THREE.WebGLRenderer {
		return this._renderer;
	}

	get renderPass(): RenderPass {
		return this._renderPass;
	}

	get localVideoSceen(): LocalVideoScreen {
		return this._localVideoSceen;
	}

	get audioFrequencyAnalyser(): AudioFrequencyAnalyser {
		return this._audioFrequencyAnalyser;
	}
}

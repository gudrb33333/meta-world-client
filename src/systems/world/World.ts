import * as THREE from 'three';
import * as CANNON from 'cannon';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { CameraOperator } from '../core/CameraOperator';

import { InputManager } from '../core/InputManager';
import { LoadingManager } from '../core/LoadingManager';
import { Sky } from './Sky';
import { IUpdatable } from '../interfaces/IUpdatable';


export class World {
    public requestAnimationFrameId;
    public renderer: THREE.WebGLRenderer;
    public camera: THREE.PerspectiveCamera;
    public cameraOperator: CameraOperator;
	public sky: Sky;
    public composer: EffectComposer;
    public graphicsWorld: THREE.Scene;
	public physicsWorld: CANNON.World;
    public clock: THREE.Clock;
	public renderDelta: number;
	public logicDelta: number;
	public requestDelta: number;
	public sinceLastFrame: number;
	public justRendered: boolean;
    public params: WorldParams;
    public timeScaleTarget = 1;

	public inputManager: InputManager;

	public updatables: IUpdatable[] = [];

    constructor(worldScenePath?: string){
        const scope = this;

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
		window.addEventListener('resize', onWindowResize, false);

        
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
		// this.physicsWorld = new CANNON.World();
		// this.physicsWorld.gravity.set(0, -9.81, 0);
		// this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
		// this.physicsWorld.solver.iterations = 10;
		// this.physicsWorld.allowSleep = true;

		// this.physicsFrameRate = 60;
		// this.physicsFrameTime = 1 / this.physicsFrameRate;
		// this.physicsMaxPrediction = this.physicsFrameRate;

        // RenderLoop
		this.clock = new THREE.Clock();
		this.renderDelta = 0;
		this.logicDelta = 0;
		this.sinceLastFrame = 0;
		this.justRendered = false;

        // Stats (FPS, Frame time, Memory)
		//this.stats = Stats();
		// Create right panel GUI
		//this.createParamsGUI(scope);

        // Initialization
		this.inputManager = new InputManager(this, this.renderer.domElement);
		this.cameraOperator = new CameraOperator(
			this,
			this.camera,
			this.params.Mouse_Sensitivity,
		);
		this.sky = new Sky(this);

		this.inputManager.setInputReceiver(this.cameraOperator);
    
        // Load scene if path is supplied
		if (worldScenePath !== undefined) {
            const loadingManager = new LoadingManager(this);
        
            loadingManager.onFinishedCallback = async () => {
                this.update(1, 1);
				this.setTimeScale(1);
            }

            loadingManager.loadGLTF(worldScenePath, (gltf) => {
				this.loadScene(loadingManager, gltf);
			});

            this.render(this);
        }
    }

    public setTimeScale(value: number): void {
		this.params.Time_Scale = value;
		this.timeScaleTarget = value;
	}

    public loadScene(loadingManager: LoadingManager, gltf: any): void {
        this.graphicsWorld.add(gltf.scene);
    }

	public registerUpdatable(registree: IUpdatable): void {
		this.updatables.push(registree);
		this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1));
	}

    // Update
	// Handles all logic updates.
	public update(timeStep: number, unscaledTimeStep: number): void {
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

        // Actual rendering with a FXAA ON/OFF switch
		if (this.params.FXAA) this.composer.render();
		else this.renderer.render(this.graphicsWorld, this.camera);

		// Logic
		world.update(timeStep, unscaledTimeStep);

		// Measuring render time
		this.renderDelta = this.clock.getDelta();
    }
}
import * as THREE from 'three';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DirectionalLight, HemisphereLight, Object3D } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

export class SidebarCanvas {
	private static instance: SidebarCanvas;

	private _container: HTMLElement;
	private _requestAnimationFrameId;
	private _camera: THREE.PerspectiveCamera;
	private _graphicsWorld: THREE.Scene;
	private _gltfLoader: GLTFLoader;
	private _dracoLoader: DRACOLoader;
	private _renderer: THREE.WebGLRenderer;
	private _controls: OrbitControls;
	private _composer: EffectComposer;
	private _model: THREE.Object3D;

	private constructor() {
		const scope = this;
		this._container = document.getElementById('clothing-container');

		// Renderer
		this._renderer = new THREE.WebGLRenderer({ antialias: true });
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
		this._renderer.toneMapping = THREE.ReinhardToneMapping;
		this._renderer.toneMappingExposure = 1;
		this._renderer.shadowMap.enabled = false;
		this._renderer.shadowMap.type = THREE.BasicShadowMap;
		this._renderer.domElement.style.paddingLeft = '0';
		this._renderer.domElement.style.paddingRight = '0';
		this._renderer.domElement.style.marginLeft = 'auto';
		this._renderer.domElement.style.marginRight = 'auto';
		this._renderer.domElement.style.display = 'block';
		this._container.appendChild(this._renderer.domElement);

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

		window.addEventListener('resize', onWindowResize, false);

		this._graphicsWorld = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / 2 / (window.innerHeight / 2),
			0.1,
			1000,
		);

		// Passes
		const renderPass = new RenderPass(this._graphicsWorld, this._camera);
		const fxaaPass = new ShaderPass(FXAAShader);

		// FXAA
		const pixelRatio = this._renderer.getPixelRatio();
		fxaaPass.material['uniforms'].resolution.value.x =
			1 / (window.innerWidth * pixelRatio);
		fxaaPass.material['uniforms'].resolution.value.y =
			1 / (window.innerHeight * pixelRatio);

		// Composer
		this._composer = new EffectComposer(this._renderer);
		this._composer.addPass(renderPass);
		this._composer.addPass(fxaaPass);

		// LIGHTS
		const ambientLight = new HemisphereLight(
			'white', // bright sky color
			'darkslategrey', // dim ground color
			5, // intensity
		);
		this._graphicsWorld.add(ambientLight);

		const mainLight = new DirectionalLight('white', 5);
		mainLight.position.set(0, 5, 5);
		this._graphicsWorld.add(mainLight);

		this._graphicsWorld.background = new THREE.Color(0xbbbbbb);

		this._gltfLoader = new GLTFLoader();

		this._dracoLoader = new DRACOLoader();
		this._dracoLoader.setDecoderPath(
			'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/',
		);
		this._dracoLoader.setDecoderConfig({ type: 'js' });

		this._gltfLoader.setDRACOLoader(this._dracoLoader);

		this._controls = new OrbitControls(this._camera, this._renderer.domElement);

		this.render();
	}

	public loadClothing(name: string) {
		if (this._model) {
			this.removeModelObject();
		}
		// model
		this._gltfLoader.load(
			`/assets/clothing/${name}.glb`,
			(gltf) => {
				this._model = gltf.scene;

				this._graphicsWorld.add(gltf.scene);

				this._controls.target.x = this._model.position.x;
				this._controls.target.y = this._model.position.y + 0.5;
				this._controls.target.z = this._model.position.z;
				this._controls.enableDamping = true;
				this._controls.minDistance = 1;
				this._controls.maxDistance = 5;
				this._controls.update();

				this._camera.position.set(0, 0.5, 2);
			},
			(xhr) => {},
			(error) => {
				console.error(error);
			},
		);
	}

	public removeModelObject() {
		if (this._model) {
			this._graphicsWorld.remove(this._model);
		}
	}

	public static getInstance() {
		if (!SidebarCanvas.instance) {
			SidebarCanvas.instance = new SidebarCanvas();
		}
		return SidebarCanvas.instance;
	}

	public render() {
		this._requestAnimationFrameId = requestAnimationFrame(() => {
			this.render();
		});

		this._controls.update(); // required if damping enabled
		this._renderer.render(this._graphicsWorld, this._camera);
	}

	public stopRendering() {
		console.log('stopRendering');
		cancelAnimationFrame(this._requestAnimationFrameId);
	}
}

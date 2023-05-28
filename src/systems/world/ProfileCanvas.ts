import * as THREE from 'three';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DirectionalLight, HemisphereLight } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import ThreeMeshUI from 'three-mesh-ui';

import checkIsMobile from '../../utils/isMobile';

export class ProfileCanvas {
	private static instance: ProfileCanvas;

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
	private _mixer: THREE.AnimationMixer;
	private _clock: THREE.Clock;
	private _animationClipArr: Array<THREE.AnimationClip>;
	private _raycaster: THREE.Raycaster;
	private _mouse: THREE.Vector2;
	private _objsToTest = [];
	private _selectState = false;
	private _uiContainer;
	private _pointermoveCallback: (evt: MouseEvent) => void;
	private _pointerdownCallback: () => void;
	private _pointerupCallback: () => void;

	constructor(avatar_url: string) {
		this._container = document.getElementById('profile-container');
		this._clock = new THREE.Clock();
		this._raycaster = new THREE.Raycaster();

		this._mouse = new THREE.Vector2();
		this._mouse.x = this._mouse.y = null;

		// Renderer
		this._renderer = new THREE.WebGLRenderer({ antialias: true });
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.toneMapping = THREE.ReinhardToneMapping;
		this._renderer.toneMappingExposure = 1;
		this._renderer.shadowMap.enabled = false;
		this._renderer.shadowMap.type = THREE.BasicShadowMap;
		this._container.appendChild(this._renderer.domElement);

		const width = window.innerWidth;
		const height = window.innerHeight;
		if (checkIsMobile() && width > height) {
			this._renderer.setSize(width * 0.45, height * 0.6);
		} else if (checkIsMobile() && width < height) {
			this._renderer.setSize(width * 0.8, height * 0.35);
		} else {
			this._renderer.setSize(500, 250);
		}

		// Auto window resize
		// function onWindowResize(): void {
		// 	scope._camera.aspect = window.innerWidth / window.innerHeight;
		// 	scope._camera.updateProjectionMatrix();
		// 	scope._renderer.setSize(window.innerWidth, window.innerHeight);
		// 	fxaaPass.uniforms['resolution'].value.set(
		// 		1 / (window.innerWidth * pixelRatio),
		// 		1 / (window.innerHeight * pixelRatio),
		// 	);
		// 	scope._composer.setSize(
		// 		window.innerWidth * pixelRatio,
		// 		window.innerHeight * pixelRatio,
		// 	);
		// }

		// window.addEventListener('resize', onWindowResize, false);

		this._graphicsWorld = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(45, 2.03713, 0.1, 1000);

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
		mainLight.position.set(10, 10, 10);
		this._graphicsWorld.add(mainLight);

		const geometry = new THREE.SphereGeometry(500, 60, 40);
		geometry.scale(-1, 1, 1);

		const texture = new THREE.TextureLoader().load('assets/zd218ru-lobby.jpeg');
		const material = new THREE.MeshBasicMaterial({ map: texture });

		const mesh = new THREE.Mesh(geometry, material);

		this._graphicsWorld.add(mesh);

		this._gltfLoader = new GLTFLoader();

		this._dracoLoader = new DRACOLoader();
		this._dracoLoader.setDecoderPath(
			'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/',
		);
		this._dracoLoader.setDecoderConfig({ type: 'js' });

		this._gltfLoader.setDRACOLoader(this._dracoLoader);

		this._controls = new OrbitControls(this._camera, this._renderer.domElement);

		this._pointermoveCallback = (event: MouseEvent) => {
			const rect = this._renderer.domElement.getBoundingClientRect();
			this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		};

		this._pointerdownCallback = () => {
			this._selectState = true;
		};
		this._pointerupCallback = () => {
			this._selectState = false;
		};

		document.addEventListener('pointermove', this._pointermoveCallback);
		document.addEventListener('pointerdown', this._pointerdownCallback);
		document.addEventListener('pointerup', this._pointerupCallback);

		this.makePanel();
		this.loadAvatar(avatar_url);
		this.render();
	}

	public async loadAvatar(avatar_url: string) {
		// model
		this._gltfLoader.load(
			avatar_url,
			async (gltf) => {
				this._mixer = new THREE.AnimationMixer(gltf.scene);
				this._animationClipArr = new Array<THREE.AnimationClip>();
				await this.setAvatarAnimation(gltf);
				this._model = gltf.scene;

				const clip = THREE.AnimationClip.findByName(
					this._animationClipArr,
					'idle',
				);
				const action = this._mixer.clipAction(clip);
				action.play();

				this._model.scale.set(8, 8, 8);
				this._graphicsWorld.add(this._model);

				this._controls.target.x = this._model.position.x * 8;
				this._controls.target.y = this._model.position.y * 8 + 11.4;
				this._controls.target.z = this._model.position.z * 8;
				this._controls.enableDamping = true;
				this._controls.minDistance = 5;
				this._controls.maxDistance = 20;
				this._controls.update();

				this._camera.position.set(0, 11.4, 10);
			},
			(xhr) => {
				xhr;
			},
			(error) => {
				console.error(error);
			},
		);
	}

	public async setAvatarAnimation(model): Promise<void> {
		const load = this.loadGLTF;
		const animationGlbList = Array<GLTF>();
		if (
			model.parser.json.nodes[4].name === 'Neck' &&
			model.parser.json.nodes[4].rotation[1] === 6.802843444120299e-8
		) {
			animationGlbList.push(await load('/assets/male/readyIdleMale.glb'));
			animationGlbList.push(await load('/assets/male/readyStandWaveMale.glb'));
			animationGlbList.push(await load('/assets/male/readyStandDanceMale.glb'));

			for (const item of animationGlbList) {
				const animationAction = this._mixer.clipAction(item.animations[0]);
				animationAction.getClip().name = item.scene.children[0].name;
				this._animationClipArr.push(animationAction.getClip());
			}
		} else if (
			model.parser.json.nodes[4].name === 'Neck' &&
			model.parser.json.nodes[4].rotation[1] === 4.327869973508314e-8
		) {
			animationGlbList.push(await load('/assets/female/readyIdleFemale.glb'));
			animationGlbList.push(
				await load('/assets/female/readyStandWaveFemale.glb'),
			);
			animationGlbList.push(
				await load('/assets/female/readyStandDanceFemale.glb'),
			);

			for (const item of animationGlbList) {
				const animationAction = this._mixer.clipAction(item.animations[0]);
				animationAction.getClip().name = item.scene.children[0].name;
				this._animationClipArr.push(animationAction.getClip());
			}
		}
	}

	public loadGLTF = (function () {
		const gltfLoader = new GLTFLoader();
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('/draco/');
		dracoLoader.setDecoderConfig({ type: 'js' });

		gltfLoader.setDRACOLoader(dracoLoader);
		return function loadGLTF(url: string): Promise<GLTF> {
			return new Promise(function (resolve, reject) {
				gltfLoader.load(url, resolve, null, reject);
			});
		};
	})();

	private playAnimation(clipName: string) {
		this._mixer.stopAllAction();
		const clip = THREE.AnimationClip.findByName(
			this._animationClipArr,
			clipName,
		);
		const action = this._mixer.clipAction(clip);
		action.play();
	}

	private makePanel() {
		this._uiContainer = new ThreeMeshUI.Block({
			justifyContent: 'center',
			contentDirection: 'row-reverse',
			fontFamily: './assets/fonts/NanumGothic-Bold.json',
			fontTexture: './assets/fonts/NanumGothic-Bold.png',
			fontSize: 0.07,
			padding: 0.02,
			borderRadius: 0.11,
		});

		this._uiContainer.position.set(0, 9.5, 2.8);
		this._uiContainer.rotation.x = -0.55;
		this._uiContainer.scale.set(6, 6, 6);
		this._graphicsWorld.add(this._uiContainer);

		const buttonOptions = {
			width: 0.4,
			height: 0.15,
			justifyContent: 'center',
			offset: 0.05,
			margin: 0.02,
			borderRadius: 0.075,
		};

		const hoveredStateAttributes = {
			state: 'hovered',
			attributes: {
				offset: 0.035,
				backgroundColor: new THREE.Color(0x999999),
				backgroundOpacity: 1,
				fontColor: new THREE.Color(0xffffff),
			},
		};

		const idleStateAttributes = {
			state: 'idle',
			attributes: {
				offset: 0.035,
				backgroundColor: new THREE.Color(0x666666),
				backgroundOpacity: 0.3,
				fontColor: new THREE.Color(0xffffff),
			},
		};

		const buttonIdle = new ThreeMeshUI.Block(buttonOptions);
		const buttonDance = new ThreeMeshUI.Block(buttonOptions);
		const buttonWave = new ThreeMeshUI.Block(buttonOptions);

		buttonIdle.add(new ThreeMeshUI.Text({ content: '기본' }));

		buttonDance.add(new ThreeMeshUI.Text({ content: '춤추기' }));

		buttonWave.add(new ThreeMeshUI.Text({ content: '인사하기' }));

		const selectedAttributes = {
			offset: 0.02,
			backgroundColor: new THREE.Color(0x777777),
			fontColor: new THREE.Color(0x222222),
		};

		buttonIdle.setupState({
			state: 'selected',
			attributes: selectedAttributes,
			onSet: () => {
				this.playAnimation('idle');
			},
		});
		buttonIdle.setupState(hoveredStateAttributes);
		buttonIdle.setupState(idleStateAttributes);

		buttonDance.setupState({
			state: 'selected',
			attributes: selectedAttributes,
			onSet: () => {
				this.playAnimation('stand_dance');
			},
		});
		buttonDance.setupState(hoveredStateAttributes);
		buttonDance.setupState(idleStateAttributes);

		buttonWave.setupState({
			state: 'selected',
			attributes: selectedAttributes,
			onSet: () => {
				this.playAnimation('stand_wave');
			},
		});

		buttonWave.setupState(hoveredStateAttributes);
		buttonWave.setupState(idleStateAttributes);

		this._uiContainer.add(buttonWave, buttonIdle, buttonDance);
		this._objsToTest.push(buttonWave, buttonIdle, buttonDance);
	}

	private updateButtons() {
		let intersect;

		if (this._mouse.x !== null && this._mouse.y !== null) {
			this._raycaster.setFromCamera(this._mouse, this._camera);
			intersect = this.raycast();
		}

		if (intersect && intersect.object.isUI) {
			if (this._selectState) {
				intersect.object.setState('selected');
			} else {
				intersect.object.setState('hovered');
			}
		}

		this._objsToTest.forEach((obj) => {
			if ((!intersect || obj !== intersect.object) && obj.isUI) {
				obj.setState('idle');
			}
		});
	}

	private raycast() {
		return this._objsToTest.reduce((closestIntersection, obj) => {
			const intersection = this._raycaster.intersectObject(obj, true);
			if (!intersection[0]) return closestIntersection;
			if (
				!closestIntersection ||
				intersection[0].distance < closestIntersection.distance
			) {
				intersection[0].object = obj;
				return intersection[0];
			}
			return closestIntersection;
		}, null);
	}

	public render() {
		ThreeMeshUI.update();
		this.updateButtons();

		this._controls.update(); // required if damping enabled
		if (this._model && this._mixer) {
			this._mixer.update(this._clock.getDelta());
			this._model.scale.set(8, 8, 8);
		}

		this._requestAnimationFrameId = requestAnimationFrame(() => {
			this.render();
		});

		try {
			this._renderer.render(this._graphicsWorld, this._camera);
		} catch {
			this._graphicsWorld.remove(this._uiContainer);
			this._objsToTest = [];
			this.makePanel();
		}
	}

	public stopRendering() {
		console.log('stopRendering');
		cancelAnimationFrame(this._requestAnimationFrameId);
		this._graphicsWorld.remove(this._uiContainer);
		document.removeEventListener('pointermove', this._pointermoveCallback);
		document.removeEventListener('pointerdown', this._pointerdownCallback);
		document.removeEventListener('pointerup', this._pointerupCallback);
	}
}

import * as THREE from 'three';
import { World } from '../world/World';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

export class Bloom {
	private world: World;

	private _bloomLayer: THREE.Layers;
	private _materials;
	private _darkMaterial;
	private _bloomComposer;
	private _finalComposer;

	constructor(world: World) {
		this.world = world;

		this._bloomLayer = new THREE.Layers();
		this._bloomLayer.set(1);

		const params = {
			exposure: 0,
			bloomStrength: 1,
			bloomThreshold: 0,
			bloomRadius: 0.5,
		};

		this._darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
		this._materials = {};

		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			1.5,
			0.4,
			0.85,
		);
		bloomPass.threshold = params.bloomThreshold;
		bloomPass.strength = params.bloomStrength;
		bloomPass.radius = params.bloomRadius;

		this._bloomComposer = new EffectComposer(world.renderer);
		this._bloomComposer.renderToScreen = false;
		this._bloomComposer.addPass(world.renderPass);
		this._bloomComposer.addPass(bloomPass);

		const finalPass = new ShaderPass(
			new THREE.ShaderMaterial({
				uniforms: {
					baseTexture: { value: null },
					bloomTexture: { value: this._bloomComposer.renderTarget2.texture },
				},
				vertexShader: `
					varying vec2 vUv;

					void main() {
					
						vUv = uv;
					
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	
					}
				`,
				fragmentShader: `
					uniform sampler2D baseTexture;
					uniform sampler2D bloomTexture;
					
					varying vec2 vUv;
					
					void main() {
					
						gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
					
					}	
				`,
				defines: {},
			}),
			'baseTexture',
		);
		finalPass.needsSwap = true;

		this._finalComposer = new EffectComposer(world.renderer);
		this._finalComposer.addPass(world.renderPass);
		this._finalComposer.addPass(finalPass);
	}

	public changerBloomStrength(strength: number): void {
		this._bloomComposer.passes[1].strength = Math.max(strength + 1, 0.6);
	}

	public renderBloomCompose(): void {
		this.world.graphicsWorld.traverse((obj: THREE.Object3D) => {
			if (
				obj instanceof THREE.Mesh &&
				this._bloomLayer.test(obj.layers) === false
			) {
				this._materials[obj.uuid] = obj.material;
				obj.material = this._darkMaterial;
			}
		});

		this._bloomComposer.render();
	}

	public renderFinalCompose(): void {
		this.world.graphicsWorld.traverse((obj: THREE.Object3D) => {
			if (obj instanceof THREE.Mesh && this._materials[obj.uuid]) {
				obj.material = this._materials[obj.uuid];
				delete this._materials[obj.uuid];
			}
		});

		this._finalComposer.render();
	}
}

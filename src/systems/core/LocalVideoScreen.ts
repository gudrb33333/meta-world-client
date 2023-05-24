import * as THREE from 'three';

import { World } from '../world/World';

export class LocalVideoScreen {
	private _world: World;

	private _localVideo: HTMLMediaElement;
	private _localVideoImage: HTMLCanvasElement;
	private _localVideoImageContext: any;
	private _localVideoTexture: THREE.Texture;

	constructor(world: World, src: string) {
		this._world = world;

		this._localVideo = document.getElementById(
			'local-video',
		) as HTMLMediaElement;
		this._localVideo.src = src;
		this._localVideoImage = document.getElementById(
			'local-video-image',
		) as HTMLCanvasElement;
		this._localVideoImageContext = this._localVideoImage.getContext('2d');

		// background color if no video present
		this._localVideoImageContext.fillStyle = '#000000';
		this._localVideoImageContext.fillRect(
			0,
			0,
			this._localVideoImage.width,
			this._localVideoImage.height,
		);

		this._localVideoTexture = new THREE.Texture(this._localVideoImage);
		this._localVideoTexture.minFilter = THREE.LinearFilter;
		this._localVideoTexture.magFilter = THREE.LinearFilter;

		const movieMaterial = new THREE.MeshBasicMaterial({
			map: this._localVideoTexture,
			side: THREE.DoubleSide,
		});
		// the geometry on which the movie will be displayed;
		// movie image will be scaled to fit these dimensions.
		const movieGeometry = new THREE.PlaneGeometry(7, 3, 1, 1);
		const localVideoScreen = new THREE.Mesh(movieGeometry, movieMaterial);
		localVideoScreen.position.set(6.72, 3.12, -0.2);

		localVideoScreen.rotation.set(0, -1.57, 0);

		this._world.graphicsWorld.add(localVideoScreen);
	}

	get localVideo(): HTMLMediaElement {
		return this._localVideo;
	}

	get localVideoImageContext(): any {
		return this._localVideoImageContext;
	}

	get localVideoTexture(): THREE.Texture {
		return this._localVideoTexture;
	}
}

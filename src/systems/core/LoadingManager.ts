import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { LoadingTrackerEntry } from './LoadingTrackerEntry';
import { UIManager } from './UIManager';
import { World } from '../world/World';

export class LoadingManager {
	public firstLoad = true;
	public onFinishedCallback: () => void;

	private _world: World;
	private _gltfLoader: GLTFLoader;
	private _dracoLoader: DRACOLoader;
	private _loadingTracker: LoadingTrackerEntry[] = [];

	constructor(world: World) {
		this._world = world;
		this._gltfLoader = new GLTFLoader();

		this._dracoLoader = new DRACOLoader();
		this._dracoLoader.setDecoderPath(
			'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/',
		);
		this._dracoLoader.setDecoderConfig({ type: 'js' });

		this._gltfLoader.setDRACOLoader(this._dracoLoader);

		this._world.setTimeScale(0);
		UIManager.setUserInterfaceVisible(false);
		UIManager.setLoadingScreenVisible(true);
	}

	public loadGLTF(path: string, onLoadingFinished: (gltf: any) => void): void {
		const trackerEntry = this.addLoadingEntry(path);

		this._gltfLoader.load(
			path,
			(gltf) => {
				onLoadingFinished(gltf);
				this.doneLoading(trackerEntry);
			},
			(xhr) => {
				if (xhr.lengthComputable) {
					trackerEntry.progress = xhr.loaded / xhr.total;
				}
			},
			(error) => {
				console.error(error);
			},
		);
	}

	public loadPromiseGLTF(path): Promise<any> {
		const trackerEntry = this.addLoadingEntry(path);

		return new Promise((resolve, reject) => {
			this._gltfLoader.load(
				path,
				(gltf) => {
					this.doneLoading(trackerEntry);
					resolve(gltf);
				},
				(xhr) => {
					if (xhr.lengthComputable) {
						trackerEntry.progress = xhr.loaded / xhr.total;
					}
				},
				(reject) => {
					console.error(reject);
				},
			);
		});
	}

	public addLoadingEntry(path: string): LoadingTrackerEntry {
		const entry = new LoadingTrackerEntry(path);
		this._loadingTracker.push(entry);

		return entry;
	}

	public doneLoading(trackerEntry: LoadingTrackerEntry): void {
		trackerEntry.finished = true;
		trackerEntry.progress = 1;

		document.dispatchEvent(new CustomEvent('done-loading-status',
			{'detail': {'doneLoading': this.getLoadingPercentage()}}
		));

		if (this.isLoadingDone()) {
			if (this.onFinishedCallback !== undefined) {
				this.onFinishedCallback();
			} else {
				UIManager.setUserInterfaceVisible(true);
			}

			UIManager.setLoadingScreenVisible(false);
		}
	}

	public createWelcomeScreenCallback(): void {
		if (this.onFinishedCallback === undefined) {
			this.onFinishedCallback = () => {
				this._world.update(1, 1);
			};
		}
	}

	private getLoadingPercentage(): number {
		let done = true;
		let total = 0;
		let finished = 0;

		for (const item of this._loadingTracker) {
			total++;
			finished += item.progress;
			if (!item.finished) done = false;
		}

		return Math.floor((finished / 50) * 100);
	}

	private isLoadingDone(): boolean {
		for (const entry of this._loadingTracker) {
			if (!entry.finished) return false;
		}
		return true;
	}
}

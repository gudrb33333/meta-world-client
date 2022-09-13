import * as THREE from 'three';
import * as Utils from '../core/FunctionLibrary';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from './World';
import { Avatar } from '../avatars/Avatar';
import { LoadingManager } from '../core/LoadingManager';

export class AvatarSpawnPoint implements ISpawnPoint {
	private object: THREE.Object3D;

	constructor(object: THREE.Object3D) {
		this.object = object;
	}

	public spawn(loadingManager: LoadingManager, world: World): void {
		loadingManager.loadGLTF(localStorage.getItem('avatar_url'), (model) => {
			const mixer = new THREE.AnimationMixer(model.scene);
			const animationClipArr = new Array<THREE.AnimationClip>();
			const modelType = this.findAvatarType(model);
			let animationClipGltfs;

			if (modelType === 'full_body_female')
				animationClipGltfs =
					this.setFullBodyFemaleAnimationClip(loadingManager);
			else if (modelType === 'full_body_male') {
				animationClipGltfs = this.setFullBodyMaleAnimationClip(loadingManager);
			} else {
				animationClipGltfs = Promise.all([]);
			}

			animationClipGltfs
				.then((results) => {
					// here the models are returned in deterministic order
					results.forEach((gltf) => {
						const animationAction = mixer.clipAction(
							(gltf as any).animations[0],
						);
						animationAction.getClip().name =
							gltf.scene.children[0].userData.name;
						animationClipArr.push(animationAction.getClip());
					});

					model.animations = animationClipArr;
					const player = new Avatar(model);

					player.setAvatarName(localStorage.getItem('avatar_name'));
					//const worldPos = new THREE.Vector3();
					//this.object.getWorldPosition(worldPos);
					//console.log(this.object.getWorldPosition(worldPos))
					//player.setAvatarName()
					player.setPosition(
						-0.08083007484674454,
						2.3437719345092773,
						-0.27053260803222656,
					);

					const forward = Utils.getForward(this.object);
					player.setOrientation(forward, true);

					world.add(player);
					player.takeControl();
				})
				.catch((err) => {
					console.log(err);
				});
		});
	}

	public spawnOtherAvatar(
		loadingManager: LoadingManager,
		world: World,
		sessionId: string,
		profile: Profile,
	): void {
		loadingManager.loadGLTF(profile.avatar_url, (model) => {
			const mixer = new THREE.AnimationMixer(model.scene);
			const animationClipArr = new Array<THREE.AnimationClip>();
			const modelType = this.findAvatarType(model);
			let animationClipGltfs;

			if (modelType === 'full_body_female')
				animationClipGltfs =
					this.setFullBodyFemaleAnimationClip(loadingManager);
			else if (modelType === 'full_body_male') {
				animationClipGltfs = this.setFullBodyMaleAnimationClip(loadingManager);
			} else {
				animationClipGltfs = Promise.all([]);
			}

			animationClipGltfs
				.then((results) => {
					// here the models are returned in deterministic order
					results.forEach((gltf) => {
						const animationAction = mixer.clipAction(
							(gltf as any).animations[0],
						);
						animationAction.getClip().name =
							gltf.scene.children[0].userData.name;
						animationClipArr.push(animationAction.getClip());
					});

					model.animations = animationClipArr;
					const player = new Avatar(model);
					player.setSessionId(sessionId);
					player.setAvatarName(profile.avatar_name);
					const worldPos = new THREE.Vector3();
					//this.object.getWorldPosition(worldPos);
					//console.log(this.object.getWorldPosition(worldPos))
					//player.setPosition(-0.08083007484674454, 2.3437719345092773, -0.27053260803222656);

					const forward = Utils.getForward(this.object);
					player.setOrientation(forward, false);
					world.add(player);
					const avatarMap = world.getAvatarMap()
					avatarMap.set(sessionId, player);
					player.setPhysicsEnabled(false);
				})
				.catch((err) => {
					console.log(err);
				});
		});
	}

	private findAvatarType(model): string {
		if (
			model.parser.json.nodes[4].name === 'Neck' &&
			model.parser.json.nodes[4].rotation[0] === 0.20306852459907532 &&
			model.parser.json.nodes[4].rotation[1] === 6.304728117356717e-8 &&
			model.parser.json.nodes[4].rotation[2] === 1.1067206884263214e-7 &&
			model.parser.json.nodes[4].rotation[3] === 0.9791645407676697
		) {
			return 'full_body_male';
		} else if (
			model.parser.json.nodes[4].name === 'Neck' &&
			model.parser.json.nodes[4].rotation[0] === 0.1396459937095642 &&
			model.parser.json.nodes[4].rotation[1] === 1.7396249774037642e-8 &&
			model.parser.json.nodes[4].rotation[2] === -1.1523127341206418e-7 &&
			model.parser.json.nodes[4].rotation[3] === 0.9902015328407288
		) {
			return 'full_body_female';
		} else {
			return 'half_body';
		}
	}

	private setFullBodyFemaleAnimationClip(loadingManager: LoadingManager) {
		return Promise.all([
			loadingManager.loadPromiseGLTF('/assets/female2/readyIdleFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female2/readyDropIdleFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female2/readyFastRunFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female2/readyJumpIdleFemale.glb'),
			loadingManager.loadPromiseGLTF(
				'/assets/female2/readyJumpingIdleFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female2/readyJumpRunningFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female2/readyRunningDropFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female2/readyRunToStopFemaleInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female2/readySlowRunFemaleInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female2/readySprintingForwardRollFemaleOveride91.glb',
			),
		]);
	}

	private setFullBodyMaleAnimationClip(loadingManager: LoadingManager) {
		return Promise.all([
			loadingManager.loadPromiseGLTF('/assets/male/readyIdleMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyDropIdleMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyFastRunMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyJumpIdleMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyJumpingIdleMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyJumpRunningMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyRunningDropMale.glb'),
			loadingManager.loadPromiseGLTF(
				'/assets/male/readyRunToStopMaleInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/male/readySlowRunMaleInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/male/readySprintingForwardRollMale.glb',
			),
			loadingManager.loadPromiseGLTF('/assets/male/readySitDownLeftMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readySitDownRightMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readySittingIdleMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyStandUpMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyStandUpLeftMale.glb'),
		]);
	}
}

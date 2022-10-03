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
		const qs = new URLSearchParams(location.search);
		let avatarPath: string;
		let avatarName: string;

		if (qs.get('user-type') === 'guest') {
			avatarPath = '/assets/male/readyDefaultMaleAvatar.glb';
			avatarName = '손님';
		} else {
			avatarPath = localStorage.getItem('avatar_url');
			avatarName = localStorage.getItem('avatar_name');
		}

		loadingManager.loadGLTF(avatarPath, (model) => {
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
				alert(
					'캐릭터 애니매이션 삽입에 실패하였습니다.\n캐릭터를 다시 생성해주세요.\n(vr전용 Half-body는 지원되지 않습니다.)',
				);
				window.history.back();
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
					player.setAvatarName(avatarName);

					let worldPos = new THREE.Vector3();
					this.object.getWorldPosition(worldPos);
					player.setPosition(worldPos.x, worldPos.y, worldPos.z);
					
					let back = Utils.getBack(this.object);
					player.setOrientation(back, true);

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
					const avatarMap = world.getAvatarMap();
					avatarMap.set(sessionId, player);
					player.setPhysicsEnabled(false);
				})
				.catch((err) => {
					console.log(err);
				});
		});
	}

	private findAvatarType(model): string {
		console.log(model)
		if (
			model.parser.json.nodes[4].name === 'Neck' &&
			model.parser.json.nodes[4].rotation[1] === 6.802843444120299e-8
		) {
			return 'full_body_male';
		} else if (
			model.parser.json.nodes[4].name === 'Neck' &&
			model.parser.json.nodes[4].rotation[1] === 4.327869973508314e-8
		) {
			return 'full_body_female';
		} else {
			return 'half_body';
		}
	}

	private setFullBodyFemaleAnimationClip(loadingManager: LoadingManager) {
		return Promise.all([
			loadingManager.loadPromiseGLTF('/assets/female/readyIdleFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female/readyDropIdleFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female/readyFastRunFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female/readyJumpIdleFemale.glb'),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readySittingIdleFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readySitDownRightFemale.glb',
			),
			loadingManager.loadPromiseGLTF('/assets/female/readyStandUpFemale.glb'),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readyJumpingIdleFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readyJumpRunningFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readyRunningDropFemale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readyRunToStopFemaleInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readySlowRunFemaleInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readySprintingForwardRollFemaleOveride91.glb',
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

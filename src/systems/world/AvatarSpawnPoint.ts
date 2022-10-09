import * as THREE from 'three';
import * as Utils from '../core/FunctionLibrary';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from './World';
import { Avatar } from '../avatars/Avatar';
import { LoadingManager } from '../core/LoadingManager';

export interface Profile {
	avatar_url: string;
	avatar_name: string;
}

export class AvatarSpawnPoint implements ISpawnPoint {
	private _object: THREE.Object3D;

	constructor(object: THREE.Object3D) {
		this._object = object;
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

					const worldPos = new THREE.Vector3();
					this._object.getWorldPosition(worldPos);
					player.setPosition(worldPos.x, worldPos.y, worldPos.z);

					const back = Utils.getBack(this._object);
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
		loadingManager.loadGLTF(
			'/assets/loading-avatar/loadingAvatar.glb',
			(model) => {
				const mixer = new THREE.AnimationMixer(model.scene);
				const animationClipArr = new Array<THREE.AnimationClip>();
				const modelType = this.findAvatarType(model);
				const animationClipGltfs =
					this.setFullBodyLoadingAvatarAnimationClip(loadingManager);

				animationClipGltfs.then((results) => {
					results.forEach((gltf) => {
						const animationAction = mixer.clipAction(
							(gltf as any).animations[0],
						);
						animationAction.getClip().name =
							gltf.scene.children[0].userData.name;
						animationClipArr.push(animationAction.getClip());
					});

					model.animations = animationClipArr;
					let player = new Avatar(model);
					player.sessionId = sessionId;
					player.setAvatarName(profile.avatar_name);

					const forward = Utils.getForward(this._object);
					player.setOrientation(forward, false);
					world.add(player);
					const avatarMap = world.avatarMap;
					avatarMap.set(sessionId, player);
					player.setPhysicsEnabled(false);

					loadingManager.loadGLTF(profile.avatar_url, (model) => {
						world.remove(player);
						const mixer = new THREE.AnimationMixer(model.scene);
						const animationClipArr = new Array<THREE.AnimationClip>();
						const modelType = this.findAvatarType(model);
						let animationClipGltfs;

						if (modelType === 'full_body_female')
							animationClipGltfs =
								this.setFullBodyFemaleAnimationClip(loadingManager);
						else if (modelType === 'full_body_male') {
							animationClipGltfs =
								this.setFullBodyMaleAnimationClip(loadingManager);
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
								player = new Avatar(model);
								player.sessionId = sessionId;
								player.setAvatarName(profile.avatar_name);
								const worldPos = new THREE.Vector3();
								//this.object.getWorldPosition(worldPos);
								//console.log(this.object.getWorldPosition(worldPos))
								//player.setPosition(-0.08083007484674454, 2.3437719345092773, -0.27053260803222656);

								const forward = Utils.getForward(this._object);
								player.setOrientation(forward, false);
								world.add(player);
								avatarMap.set(sessionId, player);
								player.setPhysicsEnabled(false);
							})
							.catch((err) => {
								console.log(err);
							});
					});
				});
			},
		);
	}

	private findAvatarType(model): string {
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

	private setFullBodyLoadingAvatarAnimationClip(
		loadingManager: LoadingManager,
	) {
		return Promise.all([
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarIdle.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarDropIdle.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarFastRun.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarJumpIdle.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarJumpingIdle.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarJumpRunning.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarRunningDrop.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarRunToStopInPlace.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarRun.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/male/readySprintingForwardRollMale.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarSitDownRight.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarSittingIdle.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarStandUp.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarStandClap.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarStandWave.glb',
			),
			loadingManager.loadPromiseGLTF(
				'/assets/loading-avatar/loadingAvatarStandDance.glb',
			),
		]);
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
			loadingManager.loadPromiseGLTF('/assets/female/readyStandClapFemale.glb'),
			loadingManager.loadPromiseGLTF('/assets/female/readyStandWaveFemale.glb'),
			loadingManager.loadPromiseGLTF(
				'/assets/female/readyStandDanceFemale.glb',
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
			loadingManager.loadPromiseGLTF('/assets/male/readyStandClapMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyStandWaveMale.glb'),
			loadingManager.loadPromiseGLTF('/assets/male/readyStandDanceMale.glb'),
		]);
	}
}

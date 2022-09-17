import * as THREE from 'three';

import { IUpdatable } from '../interfaces/IUpdatable';
import { World } from '../world/World';
import { Socket, Channel, Presence } from 'phoenix';
import { Avatar } from '../avatars/Avatar';
import { AvatarSpawnPoint } from '../world/AvatarSpawnPoint';
import { LoadingManager } from './LoadingManager';
import { Vector3 } from 'three';

export class PhoenixAdapter implements IUpdatable {
	public updateOrder = 6;

	private world: World;
	private sessionId: string;
	private socket: Socket;
	private channel: Channel;
	private presence: Presence;

	public animationMap = new Map<string, Array<any>>();
	private idleState = 0;

	constructor(
		world: World,
		serverUrl: string,
		channerTopic: string,
		profile: object,
	) {
		this.world = world;
		this.socket = new Socket(serverUrl);
		this.channel = this.socket.channel(channerTopic, { profile: profile });
		this.presence = new Presence(this.channel);

		//AnimationMap Initialization
		this.animationMap.set('idle', ['idle', 0.1]);
		this.animationMap.set('drop_idle', ['drop_idle', 0.1]);
		this.animationMap.set('drop_running_roll', ['drop_running_roll', 0.03]);
		this.animationMap.set('drop_running', ['drop_running', 0.1]);
		this.animationMap.set('stop', ['stop', 0.1]);
		this.animationMap.set('falling', ['falling', 0.3]);
		this.animationMap.set('jump_idle', ['jump_idle', 0.1]);
		this.animationMap.set('jump_running', ['jump_running', 0.03]);
		this.animationMap.set('sprint', ['sprint', 0.1]);
		this.animationMap.set('run', ['run', 0.1]);
		this.animationMap.set('sit_down_right', ['sit_down_right', 0.1]);
		this.animationMap.set('sit_down_left', ['sit_down_left', 0.1]);
		this.animationMap.set('stand_up_right', ['stand_up_right', 0.1]);
		this.animationMap.set('sitting', ['sitting', 0.1]);

		world.registerUpdatable(this);
	}

	public phoenixSocketConnect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.socket.connect();
				resolve();
			} catch (error) {
				reject();
			}
		});
	}

	public phoenixChannelJoin(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.channel
				.join()
				.receive('ok', (resp) => {
					console.log('Joined successfully', resp);
					this.sessionId = resp;
					this.world.setUserAvatar(this.sessionId);

					this.channel.on('networkedData', this.handleNetworkedData);
					//TODO: networkedDataInVehicle -> networkedDataInChair 로 수정
					this.channel.on(
						'networkedDataInVehicle',
						this.handleNetworkedDataInChair,
					);

					resolve();
				})
				.receive('error', (resp) => {
					console.log('Unable to join', resp);
					reject();
				});
		});
	}

	public getChannel() {
		return this.channel;
	}

	public onJoin(avatarLoadingManager: LoadingManager) {
		this.presence.onJoin((id, beforeJoin, afterJoin) => {
			if (beforeJoin === undefined) {
				console.log('onJoin', ':', afterJoin.metas[0]);
				if (id != this.sessionId) {
					const avatarSpawnPoint = new AvatarSpawnPoint(new THREE.Object3D());
					avatarSpawnPoint.spawnOtherAvatar(
						avatarLoadingManager,
						this.world,
						id,
						afterJoin.metas[0].profile,
					);
				}
			}
		});
	}

	public onLeave() {
		this.presence.onLeave((id, remaining, afteremovedrJoin) => {
			let leaveAvatar: Avatar;
			this.world.getAvatars().forEach((avatar) => {
				if (avatar.getSessionId() == id) {
					leaveAvatar = avatar;
					this.world.getAvatarMap().delete(id);
				}
			});

			this.world.remove(leaveAvatar);
		});
	}

	public onSync() {
		this.presence.onSync(() => {
			const users = this.presence.list();
			console.log('users:', users);
		});
	}

	public disconnect() {
		this.socket.disconnect();
	}

	public handleNetworkedData = (data) => {
		const targetAvatar: Avatar = this.world.getAvatarMap().get(data.sessionId);

		targetAvatar.setPosition(data.positionX, data.positionY, data.positionZ);
		targetAvatar.setAnimation2(
			this.animationMap.get(data.animation)[0],
			this.animationMap.get(data.animation)[1],
		);
		targetAvatar.rotation.x = data.rotationX;
		targetAvatar.rotation.y = data.rotationY;
		targetAvatar.rotation.z = data.rotationZ;
	};

	public handleNetworkedDataInChair = (data) => {
		const targetAvatar: Avatar = this.world.getAvatarMap().get(data.sessionId);

		targetAvatar.setPosition(data.positionX, data.positionY, data.positionZ);
		targetAvatar.setAnimation2(
			this.animationMap.get(data.animation)[0],
			this.animationMap.get(data.animation)[1],
		);
		targetAvatar.rotation.x = data.vehicleRotationX;
		targetAvatar.rotation.y = data.vehicleRotationY;
		targetAvatar.rotation.z = data.vehicleRotationZ;
	};

	public update(timestep: number, unscaledTimeStep: number): void {
		const userAvatar = this.world.getUserAvatar();
		const chairs = this.world.getChairs();
		const userEnteredVehicle = chairs.filter(
			(chair) => chair.children.length > 1,
		);

		if (userAvatar != null && userEnteredVehicle[0] != null) {
			this.channel.push('networkedDataInVehicle', {
				sessionId: userAvatar.getSessionId(),
				positionX: userEnteredVehicle[0].position.x,
				positionY: userEnteredVehicle[0].position.y + 0.5,
				positionZ: userEnteredVehicle[0].position.z,
				animation: userAvatar.getAvatarAnimationState(),
				vehicleRotationX: userEnteredVehicle[0].rotation.x,
				vehicleRotationY: userEnteredVehicle[0].rotation.y,
				vehicleRotationZ: userEnteredVehicle[0].rotation.z,
				vehicleSpawnName: userEnteredVehicle[0].getSpawnPoint().name,
			});
		} else if (userAvatar != null) {
			this.channel.push('networkedData', {
				sessionId: userAvatar.getSessionId(),
				positionX: userAvatar.position.x,
				positionY: userAvatar.position.y,
				positionZ: userAvatar.position.z,
				animation: userAvatar.getAvatarAnimationState(),
				rotationX: userAvatar.rotation.x,
				rotationY: userAvatar.rotation.y,
				rotationZ: userAvatar.rotation.z,
			});
		}

		// if(userAvatar != null){
		//     this.channel.push("networkedData", {
		//         "sessionId" : userAvatar.sessionId,
		//         "positionX" : userAvatar.position.x,
		//         "positionY" : userAvatar.position.y,
		//         "positionZ" : userAvatar.position.z,
		//         "animation" : userAvatar.avatarAnimationState,
		//         "orientationX" : userAvatar.orientation.x,
		//         "orientationY" : userAvatar.orientation.y,
		//         "orientationZ" : userAvatar.orientation.z,
		//     })
		//this.idleState ++;
		//console.log("idleState:",this.idleState)
		// }else if(userAvatar != null && userAvatar.avatarAnimationState !='idle'){
		//     this.channel.push("naf", {
		//         "sessionId" : userAvatar.sessionId,
		//         "positionX" : userAvatar.position.x,
		//         "positionY" : userAvatar.position.y,
		//         "positionZ" : userAvatar.position.z,
		//         "animation" : userAvatar.avatarAnimationState,
		//         "orientationX" : userAvatar.orientation.x,
		//         "orientationY" : userAvatar.orientation.y,
		//         "orientationZ" : userAvatar.orientation.z,
		//     })
		//     this.idleState = 0
		//     //console.log("idleState:",this.idleState)
		// }
		// }
	}
}

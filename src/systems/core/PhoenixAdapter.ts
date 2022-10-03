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
		this.animationMap.set('stand_clap',['stand_clap', 0.3]);

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
					this.channel.on(
						'networkedDataInChair',
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
		if (targetAvatar) {
			targetAvatar.setPosition(data.positionX, data.positionY, data.positionZ);
			targetAvatar.setOtherAvatarAnimation(
				this.animationMap.get(data.animation)[0],
				this.animationMap.get(data.animation)[1],
			);
			targetAvatar.rotation.x = data.rotationX;
			targetAvatar.rotation.y = data.rotationY;
			targetAvatar.rotation.z = data.rotationZ;
		}
	};

	public handleNetworkedDataInChair = (data) => {
		const targetAvatar: Avatar = this.world.getAvatarMap().get(data.sessionId);

		if (targetAvatar) {
			targetAvatar.setPosition(data.positionX, data.positionY, data.positionZ);
			targetAvatar.setOtherAvatarAnimation(
				this.animationMap.get(data.animation)[0],
				this.animationMap.get(data.animation)[1],
			);
			targetAvatar.rotation.x = data.chairRotationX;
			targetAvatar.rotation.y = data.chairRotationY;
			targetAvatar.rotation.z = data.chairRotationZ;
		}
	};

	public update(timestep: number, unscaledTimeStep: number): void {
		const userAvatar = this.world.getUserAvatar();
		const chairs = this.world.getChairs();
		const userEnteredChair = chairs.filter(
			(chair) => chair.children.length > 1,
		);

		if (userAvatar != null && userEnteredChair[0] != null) {
			this.channel.push('networkedDataInChair', {
				sessionId: userAvatar.getSessionId(),
				positionX: userEnteredChair[0].position.x,
				positionY: userEnteredChair[0].position.y + 0.5,
				positionZ: userEnteredChair[0].position.z,
				animation: userAvatar.getAvatarAnimationState(),
				chairRotationX: userEnteredChair[0].rotation.x,
				chairRotationY: userEnteredChair[0].rotation.y,
				chairRotationZ: userEnteredChair[0].rotation.z,
				vehicleSpawnName: userEnteredChair[0].getSpawnPoint().name,
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
	}
}

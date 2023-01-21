import * as THREE from 'three';

import { IUpdatable } from '../interfaces/IUpdatable';
import { World } from '../world/World';
import { Socket, Channel, Presence } from 'phoenix';
import { Avatar } from '../avatars/Avatar';
import { AvatarSpawnPoint } from '../world/AvatarSpawnPoint';
import { LoadingManager } from './LoadingManager';
import { Vector3 } from 'three';
import { Chair } from '../objects/Chair';

export class PhoenixAdapter implements IUpdatable {
	public updateOrder = 6;

	private _world: World;
	private _sessionId: string;
	private _socket: Socket;
	private _channel: Channel;
	private _presence: Presence;
	private _animationMap = new Map<string, Array<any>>();

	private _idleState = 0;

	constructor(
		world: World,
		serverUrl: string,
		channerTopic: string,
		profile: object,
	) {
		this._world = world;
		this._socket = new Socket(serverUrl);
		this._channel = this._socket.channel(channerTopic, { profile: profile });
		this._presence = new Presence(this._channel);

		//AnimationMap Initialization
		this._animationMap.set('idle', ['idle', 0.1]);
		this._animationMap.set('drop_idle', ['drop_idle', 0.1]);
		this._animationMap.set('drop_running_roll', ['drop_running_roll', 0.03]);
		this._animationMap.set('drop_running', ['drop_running', 0.1]);
		this._animationMap.set('stop', ['stop', 0.1]);
		this._animationMap.set('falling', ['falling', 0.3]);
		this._animationMap.set('jump_idle', ['jump_idle', 0.1]);
		this._animationMap.set('jump_running', ['jump_running', 0.03]);
		this._animationMap.set('sprint', ['sprint', 0.1]);
		this._animationMap.set('run', ['run', 0.1]);
		this._animationMap.set('sit_down_right', ['sit_down_right', 0.1]);
		this._animationMap.set('sit_down_left', ['sit_down_left', 0.1]);
		this._animationMap.set('stand_up_right', ['stand_up_right', 0.1]);
		this._animationMap.set('sitting', ['sitting', 0.1]);
		this._animationMap.set('stand_clap', ['stand_clap', 0.3]);
		this._animationMap.set('stand_wave', ['stand_wave', 0.3]);
		this._animationMap.set('stand_dance', ['stand_dance', 0.3]);

		world.registerUpdatable(this);
	}

	public phoenixSocketConnect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this._socket.connect();
				resolve();
			} catch (error) {
				reject();
			}
		});
	}

	public phoenixChannelJoin(): Promise<void> {
		return new Promise((resolve, reject) => {
			this._channel
				.join()
				.receive('ok', (resp) => {
					console.log('Joined successfully', resp);
					this._sessionId = resp;
					this._world.setUserAvatarAndAvatarMap(this._sessionId);

					this._channel.on('networkedData', this.handleNetworkedData);
					this._channel.on(
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

	public onJoin(avatarLoadingManager: LoadingManager) {
		this._presence.onJoin((id, beforeJoin, afterJoin) => {
			if (beforeJoin === undefined) {
				console.log('onJoin', ':', afterJoin.metas[0]);
				if (id != this._sessionId) {
					const avatarSpawnPoint = new AvatarSpawnPoint(new THREE.Object3D());
					avatarSpawnPoint.spawnOtherAvatar(
						avatarLoadingManager,
						this._world,
						id,
						afterJoin.metas[0].profile,
					);
				}
			}
		});
	}

	public onLeave() {
		this._presence.onLeave((id, remaining, afteremovedrJoin) => {
			let leaveAvatar: Avatar;
			this._world.avatars.forEach((avatar) => {
				if (avatar.sessionId == id) {
					leaveAvatar = avatar;
					this._world.avatarMap.delete(id);
				}
			});

			this._world.remove(leaveAvatar);
		});
	}

	public onSync() {
		this._presence.onSync(() => {
			const users = this._presence.list();
			console.log('users:', users);
		});
	}

	public disconnect() {
		this._socket.disconnect();
	}

	public handleNetworkedData = (data) => {
		const targetAvatar: Avatar = this._world.avatarMap.get(data.sessionId);
		if (targetAvatar) {
			targetAvatar.setPosition(data.positionX, data.positionY, data.positionZ);
			targetAvatar.setOtherAvatarAnimation(
				this._animationMap.get(data.animation)[0],
				this._animationMap.get(data.animation)[1],
			);
			targetAvatar.rotation.x = data.rotationX;
			targetAvatar.rotation.y = data.rotationY;
			targetAvatar.rotation.z = data.rotationZ;
		}
	};

	public handleNetworkedDataInChair = (data) => {
		const targetAvatar: Avatar = this._world.avatarMap.get(data.sessionId);

		if (targetAvatar) {
			targetAvatar.setPosition(data.positionX, data.positionY, data.positionZ);
			targetAvatar.setOtherAvatarAnimation(
				this._animationMap.get(data.animation)[0],
				this._animationMap.get(data.animation)[1],
			);
			targetAvatar.rotation.x = data.chairRotationX;
			targetAvatar.rotation.y = data.chairRotationY;
			targetAvatar.rotation.z = data.chairRotationZ;
		}
	};

	public update(timestep: number, unscaledTimeStep: number): void {
		const userAvatar = this._world.userAvatar;
		const worldObjects = this._world.worldObjects;
		const userEnteredChair = worldObjects.filter((worldObject) => worldObject.isSeated);

		if (userAvatar != null && userEnteredChair[0] != null) {
			this._channel.push('networkedDataInChair', {
				sessionId: userAvatar.sessionId,
				positionX: userEnteredChair[0].position.x,
				positionY: userEnteredChair[0].position.y + 0.5,
				positionZ: userEnteredChair[0].position.z,
				animation: userAvatar.avatarAnimationState,
				chairRotationX: userEnteredChair[0].rotation.x,
				chairRotationY: userEnteredChair[0].rotation.y,
				chairRotationZ: userEnteredChair[0].rotation.z,
				vehicleSpawnName: userEnteredChair[0].spawnPoint.name,
			});
		} else if (userAvatar != null) {
			this._channel.push('networkedData', {
				sessionId: userAvatar.sessionId,
				positionX: userAvatar.position.x,
				positionY: userAvatar.position.y,
				positionZ: userAvatar.position.z,
				animation: userAvatar.avatarAnimationState,
				rotationX: userAvatar.rotation.x,
				rotationY: userAvatar.rotation.y,
				rotationZ: userAvatar.rotation.z,
			});
		}
	}

	get channel() {
		return this._channel;
	}
}

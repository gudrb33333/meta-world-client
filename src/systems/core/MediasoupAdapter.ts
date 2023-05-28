import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { World } from '../world/World';
import { IUpdatable } from '../interfaces/IUpdatable';
import { Chair } from '../objects/Chair';

export interface RemoteWebcamInfo {
	remoteWebcamSocketId: string;
	remoteWebcam: any;
	remoteWebcamImage: HTMLCanvasElement;
	remoteWebcamImageContext: CanvasRenderingContext2D;
	remoteWebcamTexture: THREE.Texture;
	remoteWebcamScreen: THREE.Mesh;
}

export interface RemoteShareInfo {
	remoteShareSocketId: string;
	remoteShare: any;
	remoteShareImage: HTMLCanvasElement;
	remoteShareImageContext: CanvasRenderingContext2D;
	remoteShareTexture: THREE.Texture;
	remoteShareScreen: THREE.Mesh;
}

export class MediasoupAdapter implements IUpdatable {
	public updateOrder = 7;

	private _world: World;
	private _mediasoupSocket: Socket;
	private _roomName: string;

	private _device;

	private _rtpCapabilities;
	private _micProducer;
	private _micParams;
	private _micDefaultParams;
	private _shareProducer;
	private _shareParams;
	private _shareDefalutParams;

	private _webcamProducer;
	private _webcamParams;
	private _webcamDefalutParams;

	private _localWebcam;
	private _localWebcamImage;
	private _localWebcamImageContext;
	private _localWebcamTexture;
	private _localWebcamScreen;

	private _localShare;
	private _localShareImage;
	private _localShareImageContext;
	private _localShareTexture;
	private _localShareScreen;

	private _remoteWebcamKeyList = [];
	private _remoteWebcamMap = new Map<string, RemoteWebcamInfo>();

	private _remoteShareKeyList = [];
	private _remoteShareMap = new Map<string, RemoteShareInfo>();

	private _producerTransport;
	private _consumerTransports = [];
	private _consumingTransports = [];

	constructor(world: World, serverUrl: string, roomName: string) {
		this._world = world;
		this._roomName = roomName;
		this._mediasoupSocket = io(serverUrl, { transports: ['websocket'] });

		this._mediasoupSocket.on('connection-success', async ({ socketId }) => {
			const avaterSessionId = this._world.userAvatar.sessionId;
			await this._mediasoupSocket.emit(
				'set-socket-id',
				{ avaterSessionId },
				() => {
					console.log('set-socket-id');
					this.getLocalAudioStream();

					// server informs the client of a new producer just joined
					this._mediasoupSocket.on('new-producer', ({ producerId, socketId }) =>
						this.signalNewConsumerTransport(producerId, socketId),
					);

					this._mediasoupSocket.on(
						'producer-closed',
						({ remoteProducerId, remoteProducerAppData }) => {
							// server notification is received when a producer is closed
							// we need to close the client-side consumer and associated transport
							const producerToClose = this._consumerTransports.find(
								(transportData) =>
									transportData.producerId === remoteProducerId,
							);
							producerToClose.consumerTransport.close();
							producerToClose.consumer.close();

							// remove the consumer transport from the list
							this._consumerTransports = this._consumerTransports.filter(
								(transportData) =>
									transportData.producerId !== remoteProducerId,
							);

							console.log('remoteProducerAppData:', remoteProducerAppData);

							if (remoteProducerAppData.target === 'webcam') {
								const remoteWebcamInfo: RemoteWebcamInfo =
									this._remoteWebcamMap.get(remoteProducerId);

								this._world.graphicsWorld.remove(
									remoteWebcamInfo.remoteWebcamScreen,
								);
								this._remoteWebcamKeyList = this._remoteWebcamKeyList.filter(
									(remoteWebcamKey) => remoteWebcamKey != remoteProducerId,
								);
								this._remoteWebcamMap.delete(remoteProducerId);

								// remove the video div element
								const remoteProducerContainer = document.getElementById(
									'remote-producer-container',
								);
								remoteProducerContainer.removeChild(
									document.getElementById(`td-${remoteProducerId}`),
								);
							} else if (remoteProducerAppData.target === 'share') {
								const remoteShareInfo: RemoteShareInfo =
									this._remoteShareMap.get(remoteProducerId);

								this._world.graphicsWorld.remove(
									remoteShareInfo.remoteShareScreen,
								);
								this._remoteShareKeyList = this._remoteShareKeyList.filter(
									(remoteShareKey) => remoteShareKey != remoteProducerId,
								);
								this._remoteShareMap.delete(remoteProducerId);

								// remove the video div element
								const remoteProducerContainer = document.getElementById(
									'remote-producer-container',
								);
								remoteProducerContainer.removeChild(
									document.getElementById(`td-${remoteProducerId}`),
								);
							}
						},
					);
				},
			);
		});
		this._micDefaultParams = {
			appData: {
				target: 'mic',
			},
		};

		this._webcamDefalutParams = {
			appData: {
				target: 'webcam',
			},
			// mediasoup params
			encodings: [
				{
					rid: 'r0',
					maxBitrate: 100000,
					scalabilityMode: 'S3T3',
				},
				{
					rid: 'r1',
					maxBitrate: 300000,
					scalabilityMode: 'S3T3',
				},
				{
					rid: 'r2',
					maxBitrate: 900000,
					scalabilityMode: 'S3T3',
				},
			],
			// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
			codecOptions: {
				videoGoogleStartBitrate: 1000,
			},
		};

		this._shareDefalutParams = {
			appData: {
				target: 'share',
			},
		};

		world.registerUpdatable(this);
	}

	private getLocalAudioStream = () => {
		console.log('getLocalAudioStream()');
		navigator.mediaDevices
			.getUserMedia({
				audio: true,
			})
			.then(this.audioStreamSuccess)
			.catch((error) => {
				console.log(error.message);
			});
	};

	private audioStreamSuccess = (stream) => {
		const localAudio = document.getElementById(
			'local-audio',
		) as HTMLAudioElement;
		localAudio.srcObject = stream;

		this._micParams = {
			track: stream.getAudioTracks()[0],
			...this._micDefaultParams,
		};
		//webcamParams = { track: stream.getVideoTracks()[0], ...webcamDefalutParams };

		document.dispatchEvent(new Event('init-mic-event'));

		this.joinRoom();
	};

	private joinRoom = () => {
		console.log('joinRoom():', this._roomName);
		const roomName = this._roomName;
		this._mediasoupSocket.emit('joinRoom', { roomName }, (data) => {
			console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`);
			// we assign to local variable and will be used when
			// loading the client Device (see createDevice above)
			this._rtpCapabilities = data.rtpCapabilities;

			// once we have rtpCapabilities from the Router, create Device
			this.createDevice();
		});
	};

	private createDevice = async () => {
		try {
			this._device = new mediasoupClient.Device();
			await this._device.load({
				routerRtpCapabilities: this._rtpCapabilities,
			});

			console.log('Device RTP Capabilities', this._device.rtpCapabilities);

			// once the device loads, create transport
			this.createSendTransport();
		} catch (error) {
			console.log(error);
			if (error.name === 'UnsupportedError')
				console.warn('browser not supported');
		}
	};

	private createSendTransport = () => {
		// see server's socket.on('createWebRtcTransport', sender?, ...)
		// this is a call from Producer, so sender = true
		this._mediasoupSocket.emit(
			'createWebRtcTransport',
			{ consumer: false },
			({ params }) => {
				// The server sends back params needed
				// to create Send Transport on the client side
				if (params.error) {
					console.log(params.error);
					return;
				}
				// creates a new WebRTC Transport to send media
				// based on the server's producer transport params
				// https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
				this._producerTransport = this._device.createSendTransport(params);

				// https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
				// this event is raised when a first call to transport.produce() is made
				// see connectSendTransport() below
				this._producerTransport.on(
					'connect',
					async ({ dtlsParameters }, callback, errback) => {
						try {
							// Signal local DTLS parameters to the server side transport
							// see server's socket.on('transport-connect', ...)
							await this._mediasoupSocket.emit('transport-connect', {
								dtlsParameters,
							});

							// Tell the transport that parameters were transmitted.
							callback();
						} catch (error) {
							errback(error);
						}
					},
				);

				this._producerTransport.on(
					'produce',
					async (parameters, callback, errback) => {
						try {
							// tell the server to create a Producer
							// with the following parameters and produce
							// and expect back a server side producer id
							// see server's socket.on('transport-produce', ...)
							await this._mediasoupSocket.emit(
								'transport-produce',
								{
									kind: parameters.kind,
									rtpParameters: parameters.rtpParameters,
									appData: parameters.appData,
								},
								({ id, producersExist }) => {
									// Tell the transport that parameters were transmitted and provide it with the
									// server side producer's id.
									callback({ id });

									// if producers exist, then join room
									if (producersExist) this.getProducers();
								},
							);
						} catch (error) {
							errback(error);
						}
					},
				);

				//connectSendTransport
				this.enableMic();
			},
		);
	};

	private getProducers = () => {
		this._mediasoupSocket.emit('getProducers', (producerIds, socketIds) => {
			// for each of the producer create a consumer
			// producerIds.forEach(id => signalNewConsumerTransport(id))
			producerIds.forEach((producerId, index) => {
				this.signalNewConsumerTransport(producerId, socketIds[index]);
			});
		});
	};

	private signalNewConsumerTransport = async (remoteProducerId, socketId) => {
		//check if we are already consuming the remoteProducerId
		if (this._consumingTransports.includes(remoteProducerId)) return;
		this._consumingTransports.push(remoteProducerId);

		await this._mediasoupSocket.emit(
			'createWebRtcTransport',
			{ consumer: true },
			({ params }) => {
				// The server sends back params needed
				// to create Send Transport on the client side
				if (params.error) {
					console.log(params.error);
					return;
				}
				console.log(`PARAMS... ${params}`);

				let consumerTransport;
				try {
					consumerTransport = this._device.createRecvTransport(params);
				} catch (error) {
					// exceptions:
					// {InvalidStateError} if not loaded
					// {TypeError} if wrong arguments.
					console.log(error);
					return;
				}

				consumerTransport.on(
					'connect',
					async ({ dtlsParameters }, callback, errback) => {
						try {
							// Signal local DTLS parameters to the server side transport
							// see server's socket.on('transport-recv-connect', ...)
							await this._mediasoupSocket.emit('transport-recv-connect', {
								dtlsParameters,
								serverConsumerTransportId: params.id,
							});

							// Tell the transport that parameters were transmitted.
							callback();
						} catch (error) {
							// Tell the transport that something was wrong
							errback(error);
						}
					},
				);

				this.connectRecvTransport(
					consumerTransport,
					remoteProducerId,
					params.id,
					socketId,
				);
			},
		);
	};

	private connectRecvTransport = async (
		consumerTransport,
		remoteProducerId,
		serverConsumerTransportId,
		socketId,
	) => {
		// for consumer, we need to tell the server first
		// to create a consumer based on the rtpCapabilities and consume
		// if the router can consume, it will send back a set of params as below
		await this._mediasoupSocket.emit(
			'consume',
			{
				rtpCapabilities: this._device.rtpCapabilities,
				remoteProducerId,
				serverConsumerTransportId,
			},
			async ({ params }) => {
				if (params.error) {
					console.log('Cannot Consume');
					return;
				}

				console.log(`Consumer Params ${params}`);

				console.log(`Consumer Params`, params);
				// then consume with the local consumer transport
				// which creates a consumer
				const consumer = await consumerTransport.consume({
					id: params.id,
					producerId: params.producerId,
					kind: params.kind,
					rtpParameters: params.rtpParameters,
				});

				this._consumerTransports = [
					...this._consumerTransports,
					{
						consumerTransport,
						serverConsumerTransportId: params.id,
						producerId: remoteProducerId,
						consumer,
					},
				];

				if (params.appData.target === 'mic') {
					const remoteProducerContainer = document.getElementById(
						'remote-producer-container',
					);
					const audioElem = document.createElement('div');
					audioElem.setAttribute('id', `td-${remoteProducerId}`);
					audioElem.innerHTML =
						'<audio id="' +
						remoteProducerId +
						'-audio" autoplay style="visibility: hidden; float:left; position: absolute;"></audio>';
					remoteProducerContainer.appendChild(audioElem);

					// destructure and retrieve the video track from the producer
					const { track } = consumer;

					const remoteWebcam = document.getElementById(
						remoteProducerId + '-audio',
					) as HTMLMediaElement;
					remoteWebcam.srcObject = new MediaStream([track]);
				} else if (params.appData.target === 'webcam') {
					const remoteProducerContainer = document.getElementById(
						'remote-producer-container',
					);
					const videoElem = document.createElement('div');

					videoElem.setAttribute('id', `td-${remoteProducerId}`);
					videoElem.innerHTML =
						'<video id="' +
						remoteProducerId +
						'-video" autoplay class="video" style="visibility: hidden; float:left; position: absolute;" ></video>' +
						'<canvas id="' +
						remoteProducerId +
						'-canvas" width="640" height="360" style="visibility: hidden; float:left; position: absolute;" ></canvas>';
					remoteProducerContainer.appendChild(videoElem);

					const remoteWebcamImage = document.getElementById(
						remoteProducerId + '-canvas',
					) as HTMLCanvasElement;

					const remoteWebcamImageContext = remoteWebcamImage.getContext('2d');
					remoteWebcamImageContext.fillStyle = '#000000';
					remoteWebcamImageContext.fillRect(
						0,
						0,
						remoteWebcamImage.width,
						remoteWebcamImage.height,
					);

					const remoteWebcamTexture = new THREE.Texture(remoteWebcamImage);
					remoteWebcamTexture.minFilter = THREE.LinearFilter;
					remoteWebcamTexture.magFilter = THREE.LinearFilter;

					const movieMaterial = new THREE.MeshBasicMaterial({
						map: remoteWebcamTexture,
						side: THREE.DoubleSide,
					});
					const movieGeometry = new THREE.PlaneGeometry(1, 0.5, 0.1, 0.1);
					const remoteWebcamScreen = new THREE.Mesh(
						movieGeometry,
						movieMaterial,
					);

					this._world.graphicsWorld.add(remoteWebcamScreen);

					// destructure and retrieve the video track from the producer
					const { track } = consumer;
					const remoteWebcam = document.getElementById(
						remoteProducerId + '-video',
					) as HTMLMediaElement;
					remoteWebcam.srcObject = new MediaStream([track]);

					this._remoteWebcamKeyList.push(remoteProducerId);

					const remoteWebcamInfo: RemoteWebcamInfo = {
						remoteWebcamSocketId: socketId,
						remoteWebcam: remoteWebcam,
						remoteWebcamImage: remoteWebcamImage,
						remoteWebcamImageContext: remoteWebcamImageContext,
						remoteWebcamTexture: remoteWebcamTexture,
						remoteWebcamScreen: remoteWebcamScreen,
					};

					console.log('111111', remoteWebcamInfo.remoteWebcam);

					this._remoteWebcamMap.set(remoteProducerId, remoteWebcamInfo);
				} else if (params.appData.target === 'share') {
					if (this._shareProducer) {
						this.disableShare();
					}

					const remoteProducerContainer = document.getElementById(
						'remote-producer-container',
					);
					const videoElem = document.createElement('div');

					videoElem.setAttribute('id', `td-${remoteProducerId}`);
					videoElem.innerHTML =
						'<video id="' +
						remoteProducerId +
						'-video" autoplay class="video" style="visibility: hidden; float:left; position: absolute;" ></video>' +
						'<canvas id="' +
						remoteProducerId +
						'-canvas" width="640" height="360" style="visibility: hidden; float:left; position: absolute;" ></canvas>';
					remoteProducerContainer.appendChild(videoElem);

					const remoteShareImage = document.getElementById(
						remoteProducerId + '-canvas',
					) as HTMLCanvasElement;

					const remoteShareImageContext = remoteShareImage.getContext('2d');
					remoteShareImageContext.fillStyle = '#000000';
					remoteShareImageContext.fillRect(
						0,
						0,
						remoteShareImage.width,
						remoteShareImage.height,
					);

					const remoteShareTexture = new THREE.Texture(remoteShareImage);
					remoteShareTexture.minFilter = THREE.LinearFilter;
					remoteShareTexture.magFilter = THREE.LinearFilter;

					const movieMaterial = new THREE.MeshBasicMaterial({
						map: remoteShareTexture,
						side: THREE.DoubleSide,
					});
					const movieGeometry = new THREE.PlaneGeometry(3.25, 1.5, 1, 1);
					const remoteShareScreen = new THREE.Mesh(
						movieGeometry,
						movieMaterial,
					);

					remoteShareScreen.position.set(0, 1.6, -1.325);
					remoteShareScreen.rotation.set(0, 3.145, 0);

					this._world.graphicsWorld.add(remoteShareScreen);

					// destructure and retrieve the video track from the producer
					const { track } = consumer;
					const remoteShare = document.getElementById(
						remoteProducerId + '-video',
					) as HTMLMediaElement;
					remoteShare.srcObject = new MediaStream([track]);

					this._remoteShareKeyList.push(remoteProducerId);

					const remoteShareInfo: RemoteShareInfo = {
						remoteShareSocketId: socketId,
						remoteShare: remoteShare,
						remoteShareImage: remoteShareImage,
						remoteShareImageContext: remoteShareImageContext,
						remoteShareTexture: remoteShareTexture,
						remoteShareScreen: remoteShareScreen,
					};

					this._remoteShareMap.set(remoteProducerId, remoteShareInfo);
				}

				// the server consumer started with media paused
				// so we need to inform the server to resume
				this._mediasoupSocket.emit('consumer-resume', {
					serverConsumerId: params.serverConsumerId,
				});
			},
		);
	};

	private enableMic = async () => {
		// we now call produce() to instruct the producer transport
		// to send media to the Router
		// https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
		// this action will trigger the 'connect' and 'produce' events above

		if (this._micProducer) return;

		this._micProducer = await this._producerTransport.produce(this._micParams);

		this._micProducer.on('trackended', () => {
			console.log('audio track ended');
		});

		this._micProducer.on('transportclose', () => {
			console.log('audio transport ended');
		});
	};

	public unmuteMic = async () => {
		console.log('unmuteMic()');
		try {
			this._micProducer.resume();
			await this._mediasoupSocket.emit('resumeProducer', {
				producerId: this._micProducer.id,
			});
		} catch (error) {
			console.error('unmuteMic() | failed: %o', error);
		}
	};

	public muteMic = async (): Promise<boolean> => {
		console.log('muteMic()');
		try {
			this._micProducer.pause();
			await this._mediasoupSocket.emit('pauseProducer', {
				producerId: this._micProducer.id,
			});
			return true;
		} catch (error) {
			console.error('muteMic() | failed: %o', error);
			return false;
		}
	};

	public enableWebcam = async () => {
		console.log('enableWebcam()');
		if (this._webcamProducer) return;

		try {
			navigator.mediaDevices
				.getUserMedia({
					audio: false,
					video: {
						width: {
							min: 640,
							max: 640,
						},
						height: {
							min: 360,
							max: 360,
						},
					},
				})
				.then(async (stream) => {
					// const localWebcam = document.getElementById('local-webcam') as HTMLVideoElement
					// localWebcam.srcObject = stream

					// create the video element
					this._localWebcam = document.getElementById(
						'local-webcam',
					) as HTMLVideoElement;
					this._localWebcam.srcObject = stream;

					this._localWebcamImage = document.getElementById(
						'local-webcam-image',
					) as HTMLCanvasElement;
					this._localWebcamImageContext =
						this._localWebcamImage.getContext('2d');

					// background color if no video present
					this._localWebcamImageContext.fillStyle = '#000000';
					this._localWebcamImageContext.fillRect(
						0,
						0,
						this._localWebcamImage.width,
						this._localWebcamImage.height,
					);

					this._localWebcamTexture = new THREE.Texture(this._localWebcamImage);
					this._localWebcamTexture.minFilter = THREE.LinearFilter;
					this._localWebcamTexture.magFilter = THREE.LinearFilter;

					const movieMaterial = new THREE.MeshBasicMaterial({
						map: this._localWebcamTexture,
						side: THREE.DoubleSide,
					});
					// the geometry on which the movie will be displayed;
					// movie image will be scaled to fit these dimensions.
					const movieGeometry = new THREE.PlaneGeometry(1, 0.5, 0.1, 0.1);
					this._localWebcamScreen = new THREE.Mesh(
						movieGeometry,
						movieMaterial,
					);
					const avatar = this._world.userAvatar;
					this._localWebcamScreen.position.set(
						avatar.position.x,
						avatar.position.y + 1.7,
						avatar.position.z,
					);

					this._world.graphicsWorld.add(this._localWebcamScreen);

					this._webcamParams = {
						track: stream.getVideoTracks()[0],
						...this._webcamDefalutParams,
					};

					this._webcamProducer = await this._producerTransport.produce(
						this._webcamParams,
					);

					this._webcamProducer.on('transportclose', () => {
						this._webcamProducer = null;
					});
					this._webcamProducer.on('trackended', () => {
						console.log('Webcam disconnected!');
						this.disableWebcam()
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							.catch(() => {});
					});
				})
				.catch((error) => {
					console.log(error.message);
				});
		} catch (error) {
			document.getElementById('button-webcam').className = 'active-off';
			console.error('enableWebcam() | failed:%o', error);
			console.error('enabling Webcam!');
		}
	};

	public disableWebcam = async () => {
		console.log('disableWebcam()');
		if (!this._webcamProducer) return;

		this._webcamProducer.close();
		try {
			await this._mediasoupSocket.emit('closeProducer', {
				producerId: this._webcamProducer.id,
			});
			this._world.graphicsWorld.remove(this._localWebcamScreen);
		} catch (error) {
			console.error(`Error closing server-side webcam Producer: ${error}`);
		}
		this._webcamProducer = null;
	};

	public enableShare = async (): Promise<boolean> => {
		return new Promise<boolean>(
			(resolve: (value: boolean) => void, reject: (error: boolean) => void) => {
				console.log('enableShare()');
				if (this._shareProducer) return reject(false);
				if (this._remoteShareKeyList.length > 0) {
					alert('이미 다른사람이 화면공유 중 입니다.');
					return reject(false);
				}

				// if (this._remoteShareKeyList.length > 1) {
				// 	this._remoteShareKeyList.forEach(async (remoteShareKey) => {
				// 		try {
				// 			await this._mediasoupSocket.emit('closeProducer', {
				// 				producerId: remoteShareKey,
				// 			});
				// 		} catch (error) {
				// 			console.error(`Error closing server-side webcam Producer: ${error}`);
				// 		}
				// 	});
				// }
				// if (!this.__mediasoupDevice.canProduce('video')) {
				//     logger.error('enableWebcam() | cannot produce video');
				//     return;
				// }
				// store.dispatch(stateActions.setWebcamInProgress(true));
				//let stream;
				try {
					navigator.mediaDevices
						.getDisplayMedia({
							audio: false,
							video: {
								width: { max: 1600 },
								height: { max: 900 },
								frameRate: { max: 30 },
							},
						})
						.then(async (stream) => {
							this._localShare = document.getElementById(
								'local-share',
							) as HTMLVideoElement;
							this._localShare.srcObject = stream;

							this._localShareImage = document.getElementById(
								'local-share-image',
							) as HTMLCanvasElement;
							this._localShareImageContext =
								this._localShareImage.getContext('2d');

							// background color if no video present
							this._localShareImageContext.fillStyle = '#000000';
							this._localShareImageContext.fillRect(
								0,
								0,
								this._localShareImage.width,
								this._localShareImage.height,
							);

							this._localShareTexture = new THREE.Texture(
								this._localShareImage,
							);
							this._localShareTexture.minFilter = THREE.LinearFilter;
							this._localShareTexture.magFilter = THREE.LinearFilter;

							const movieMaterial = new THREE.MeshBasicMaterial({
								map: this._localShareTexture,
								side: THREE.DoubleSide,
							});
							// the geometry on which the movie will be displayed;
							// movie image will be scaled to fit these dimensions.
							const movieGeometry = new THREE.PlaneGeometry(3.25, 1.5, 1, 1);
							this._localShareScreen = new THREE.Mesh(
								movieGeometry,
								movieMaterial,
							);
							this._localShareScreen.position.set(0, 1.6, -1.325);

							this._localShareScreen.rotation.set(0, 3.145, 0);

							this._world.graphicsWorld.add(this._localShareScreen);

							this._shareParams = {
								track: stream.getVideoTracks()[0],
								...this._shareDefalutParams,
							};

							this._shareProducer = await this._producerTransport.produce(
								this._shareParams,
							);

							this._shareProducer.on('transportclose', () => {
								this._shareProducer = null;
							});
							this._shareProducer.on('trackended', () => {
								console.log('share disconnected!');
								document.dispatchEvent(new Event('stop-share-event'));
							});

							return resolve(true);
						})
						.catch((error) => {
							console.log(error.message);
							return reject(false);
						});

					// if (!this.__externalVideo) {
					//     stream = await this.__worker.getUserMedia({
					//         video: { source: 'device' }
					//     });
					// }
					// else {
					//     stream = await this.__worker.getUserMedia({
					//         video: {
					//             source: this.__externalVideo.startsWith('http') ? 'url' : 'file',
					//             file: this.__externalVideo,
					//             url: this.__externalVideo
					//         }
					//     });
					// }
					// TODO: For testing.
					//global.videoStream = stream;

					//webcamProducer = await producerTransport.produce(webcamParams);
					// TODO.
					// const device = {
					//     label: 'rear-xyz'
					// };
					// store.dispatch(stateActions.addProducer({
					//     id: this.__webcamProducer.id,
					//     deviceLabel: device.label,
					//     type: this.__getWebcamType(device),
					//     paused: this.__webcamProducer.paused,
					//     track: this.__webcamProducer.track,
					//     rtpParameters: this.__webcamProducer.rtpParameters,
					//     codec: this.__webcamProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
					// }));
					//webcamProducer.on('transportclose', () => {
					//    webcamProducer = null;
					//});
					//webcamProducer.on('trackended', () => {
					//    console.log('Webcam disconnected!');
					// this._disableWebcam()
					//     // eslint-disable-next-line @typescript-eslint/no-empty-function
					//     .catch(() => { });
					//});
				} catch (error) {
					console.error('enableWebcam() | failed:%o', error);
					console.error('enabling Webcam!');
					return reject(false);
					// if (track)
					//     track.stop();
				}
				//store.dispatch(stateActions.setWebcamInProgress(false));
			},
		);
	};

	public disableShare = async () => {
		return new Promise<boolean>(
			async (
				resolve: (value: boolean) => void,
				reject: (error: boolean) => void,
			) => {
				try {
					console.log('disableShare()');
					if (!this._shareProducer) return;
					this._shareProducer.close();

					await this._mediasoupSocket.emit('closeProducer', {
						producerId: this._shareProducer.id,
					});
					this._shareProducer = null;
					this._world.graphicsWorld.remove(this._localShareScreen);
					resolve(true);
				} catch (error) {
					console.error(`Error closing server-side webcam Producer: ${error}`);
					reject(false);
				}
			},
		);
	};

	public update(timestep: number, unscaledTimeStep: number): void {
		if (
			this._localWebcam &&
			this._localWebcam.readyState === this._localWebcam.HAVE_ENOUGH_DATA
		) {
			const avatar = this._world.userAvatar;

			if (avatar.parent instanceof Chair) {
				const userEnteredChair: Chair = avatar.parent;

				this._localWebcamImageContext.drawImage(
					this._localWebcam,
					0,
					0,
					this._localWebcamImage.width,
					this._localWebcamImage.height,
				);
				if (this._localWebcamTexture) {
					this._localWebcamTexture.needsUpdate = true;
					this._localWebcamScreen.position.set(
						userEnteredChair.position.x,
						userEnteredChair.position.y + 2.2,
						userEnteredChair.position.z,
					);
					this._localWebcamScreen.rotation.copy(userEnteredChair.rotation);
				}
			} else {
				this._localWebcamImageContext.drawImage(
					this._localWebcam,
					0,
					0,
					this._localWebcamImage.width,
					this._localWebcamImage.height,
				);
				if (this._localWebcamTexture) {
					this._localWebcamTexture.needsUpdate = true;
					this._localWebcamScreen.position.set(
						avatar.position.x,
						avatar.position.y + 1.7,
						avatar.position.z,
					);
					this._localWebcamScreen.rotation.copy(avatar.rotation);
				}
			}
		}

		if (
			this._localShare &&
			this._localShare.readyState === this._localShare.HAVE_ENOUGH_DATA
		) {
			this._localShareImageContext.drawImage(
				this._localShare,
				0,
				0,
				this._localShareImage.width,
				this._localShareImage.height,
			);
			if (this._localShareTexture) {
				this._localShareTexture.needsUpdate = true;
			}
		}

		if (this._remoteWebcamKeyList.length > 0) {
			this._remoteWebcamKeyList.forEach((remoteWebcamKey) => {
				const remoteWebcamInfo: RemoteWebcamInfo =
					this._remoteWebcamMap.get(remoteWebcamKey);

				const targetAvatar = this._world.findTargetAvatar(
					remoteWebcamInfo.remoteWebcamSocketId,
				);
				remoteWebcamInfo.remoteWebcamImageContext.drawImage(
					remoteWebcamInfo.remoteWebcam,
					0,
					0,
					remoteWebcamInfo.remoteWebcamImage.width,
					remoteWebcamInfo.remoteWebcamImage.height,
				);
				if (remoteWebcamInfo.remoteWebcamTexture) {
					remoteWebcamInfo.remoteWebcamTexture.needsUpdate = true;
					remoteWebcamInfo.remoteWebcamScreen.position.set(
						targetAvatar.position.x,
						targetAvatar.position.y + 1.7,
						targetAvatar.position.z,
					);
					remoteWebcamInfo.remoteWebcamScreen.rotation.copy(
						targetAvatar.rotation,
					);
				}
			});
		}

		if (this._remoteShareKeyList.length > 0) {
			this._remoteShareKeyList.forEach((remoteShareKey) => {
				const remoteShareInfo: RemoteShareInfo =
					this._remoteShareMap.get(remoteShareKey);

				remoteShareInfo.remoteShareImageContext.drawImage(
					remoteShareInfo.remoteShare,
					0,
					0,
					remoteShareInfo.remoteShareImage.width,
					remoteShareInfo.remoteShareImage.height,
				);
				if (remoteShareInfo.remoteShareTexture) {
					remoteShareInfo.remoteShareTexture.needsUpdate = true;
				}
			});
		}
	}
}

import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { World } from '../world/World';
import { IUpdatable } from '../interfaces/IUpdatable';
import { Chair } from '../objects/Chair';

type RemoteWebcamInfo = {
	remoteWebcamSocketId: string;
	remoteWebcam: any;
	remoteWebcamImage: HTMLCanvasElement;
	remoteWebcamImageContext: CanvasRenderingContext2D;
	remoteWebcamTexture: THREE.Texture;
	remoteWebcamScreen: THREE.Mesh;
};

type RemoteShareInfo = {
	remoteShareSocketId: string;
	remoteShare: any;
	remoteShareImage: HTMLCanvasElement;
	remoteShareImageContext: CanvasRenderingContext2D;
	remoteShareTexture: THREE.Texture;
	remoteShareScreen: THREE.Mesh;
};

export class MediasoupAdapter implements IUpdatable {
	public updateOrder = 7;

	private world: World;
	private mediasoupSocket: Socket;
	private roomName = 'abc';

	private device;

	private rtpCapabilities;
	private micProducer;
	private micParams;
	private micDefaultParams;
	private shareProducer;
	private shareParams;
	private shareDefalutParams;

	private webcamProducer;
	private webcamParams;
	private webcamDefalutParams;

	private localWebcam;
	private localWebcamImage;
	private localWebcamImageContext;
	private localWebcamTexture;
	private localWebcamScreen;

	private localShare;
	private localShareImage;
	private localShareImageContext;
	private localShareTexture;
	private localShareScreen;

	private remoteWebcamKeyList = [];
	private remoteWebcamMap = new Map<string, RemoteWebcamInfo>();

	private remoteShareKeyList = [];
	private remoteShareMap = new Map<string, RemoteShareInfo>();

	private producerTransport;
	private consumerTransports = [];
	private consumingTransports = [];

	constructor(world: World, serverUrl: string) {
		this.world = world;
		this.mediasoupSocket = io(serverUrl, { transports: ['websocket'] });

		this.mediasoupSocket.on('connection-success', async ({ socketId }) => {
			const avaterSessionId = this.world.getUserAvatar().getSessionId();
			await this.mediasoupSocket.emit(
				'set-socket-id',
				{ avaterSessionId },
				() => {
					console.log('set-socket-id');
					this.getLocalAudioStream();

					// server informs the client of a new producer just joined
					this.mediasoupSocket.on('new-producer', ({ producerId, socketId }) =>
						this.signalNewConsumerTransport(producerId, socketId),
					);

					this.mediasoupSocket.on(
						'producer-closed',
						({ remoteProducerId, remoteProducerAppData }) => {
							// server notification is received when a producer is closed
							// we need to close the client-side consumer and associated transport
							const producerToClose = this.consumerTransports.find(
								(transportData) =>
									transportData.producerId === remoteProducerId,
							);
							producerToClose.consumerTransport.close();
							producerToClose.consumer.close();

							// remove the consumer transport from the list
							this.consumerTransports = this.consumerTransports.filter(
								(transportData) =>
									transportData.producerId !== remoteProducerId,
							);

							console.log('remoteProducerAppData:', remoteProducerAppData);

							if (remoteProducerAppData.target === 'webcam') {
								const remoteWebcamInfo: RemoteWebcamInfo =
									this.remoteWebcamMap.get(remoteProducerId);

								this.world
									.getGraphicsWorld()
									.remove(remoteWebcamInfo.remoteWebcamScreen);
								this.remoteWebcamKeyList = this.remoteWebcamKeyList.filter(
									(remoteWebcamKey) => remoteWebcamKey != remoteProducerId,
								);
								this.remoteWebcamMap.delete(remoteProducerId);

								// remove the video div element
								const remoteProducerContainer = document.getElementById(
									'remote-producer-container',
								);
								remoteProducerContainer.removeChild(
									document.getElementById(`td-${remoteProducerId}`),
								);
							} else if (remoteProducerAppData.target === 'share') {
								const remoteShareInfo: RemoteShareInfo =
									this.remoteShareMap.get(remoteProducerId);

								this.world
									.getGraphicsWorld()
									.remove(remoteShareInfo.remoteShareScreen);
								this.remoteShareKeyList = this.remoteShareKeyList.filter(
									(remoteShareKey) => remoteShareKey != remoteProducerId,
								);
								this.remoteShareMap.delete(remoteProducerId);

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
		this.micDefaultParams = {
			appData: {
				target: 'mic',
			},
		};

		this.webcamDefalutParams = {
			appData: {
				target: 'webcam',
			},
			// mediasoup params
			encodings: [
				{
					rid: 'r0',
					maxBitrate: 100000,
					scalabilityMode: 'S1T3',
				},
				{
					rid: 'r1',
					maxBitrate: 300000,
					scalabilityMode: 'S1T3',
				},
				{
					rid: 'r2',
					maxBitrate: 900000,
					scalabilityMode: 'S1T3',
				},
			],
			// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
			codecOptions: {
				videoGoogleStartBitrate: 1000,
			},
		};

		this.shareDefalutParams = {
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

		this.micParams = {
			track: stream.getAudioTracks()[0],
			...this.micDefaultParams,
		};
		//webcamParams = { track: stream.getVideoTracks()[0], ...webcamDefalutParams };

		document.dispatchEvent(new Event('init-mic-event'));

		this.joinRoom();
	};

	private joinRoom = () => {
		console.log('joinRoom():', this.roomName);
		const roomName = this.roomName;
		this.mediasoupSocket.emit('joinRoom', { roomName }, (data) => {
			console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`);
			// we assign to local variable and will be used when
			// loading the client Device (see createDevice above)
			this.rtpCapabilities = data.rtpCapabilities;

			// once we have rtpCapabilities from the Router, create Device
			this.createDevice();
		});
	};

	private createDevice = async () => {
		try {
			this.device = new mediasoupClient.Device();
			await this.device.load({
				routerRtpCapabilities: this.rtpCapabilities,
			});

			console.log('Device RTP Capabilities', this.device.rtpCapabilities);

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
		this.mediasoupSocket.emit(
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
				this.producerTransport = this.device.createSendTransport(params);

				// https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
				// this event is raised when a first call to transport.produce() is made
				// see connectSendTransport() below
				this.producerTransport.on(
					'connect',
					async ({ dtlsParameters }, callback, errback) => {
						try {
							// Signal local DTLS parameters to the server side transport
							// see server's socket.on('transport-connect', ...)
							await this.mediasoupSocket.emit('transport-connect', {
								dtlsParameters,
							});

							// Tell the transport that parameters were transmitted.
							callback();
						} catch (error) {
							errback(error);
						}
					},
				);

				this.producerTransport.on(
					'produce',
					async (parameters, callback, errback) => {
						try {
							// tell the server to create a Producer
							// with the following parameters and produce
							// and expect back a server side producer id
							// see server's socket.on('transport-produce', ...)
							await this.mediasoupSocket.emit(
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
		this.mediasoupSocket.emit('getProducers', (producerIds, socketIds) => {
			// for each of the producer create a consumer
			// producerIds.forEach(id => signalNewConsumerTransport(id))
			producerIds.forEach((producerId, index) => {
				this.signalNewConsumerTransport(producerId, socketIds[index]);
			});
		});
	};

	private signalNewConsumerTransport = async (remoteProducerId, socketId) => {
		//check if we are already consuming the remoteProducerId
		if (this.consumingTransports.includes(remoteProducerId)) return;
		this.consumingTransports.push(remoteProducerId);

		await this.mediasoupSocket.emit(
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
					consumerTransport = this.device.createRecvTransport(params);
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
							await this.mediasoupSocket.emit('transport-recv-connect', {
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
		await this.mediasoupSocket.emit(
			'consume',
			{
				rtpCapabilities: this.device.rtpCapabilities,
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

				this.consumerTransports = [
					...this.consumerTransports,
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

					this.world.getGraphicsWorld().add(remoteWebcamScreen);

					// destructure and retrieve the video track from the producer
					const { track } = consumer;
					const remoteWebcam = document.getElementById(
						remoteProducerId + '-video',
					) as HTMLMediaElement;
					remoteWebcam.srcObject = new MediaStream([track]);

					this.remoteWebcamKeyList.push(remoteProducerId);

					const remoteWebcamInfo: RemoteWebcamInfo = {
						remoteWebcamSocketId: socketId,
						remoteWebcam: remoteWebcam,
						remoteWebcamImage: remoteWebcamImage,
						remoteWebcamImageContext: remoteWebcamImageContext,
						remoteWebcamTexture: remoteWebcamTexture,
						remoteWebcamScreen: remoteWebcamScreen,
					};

					this.remoteWebcamMap.set(remoteProducerId, remoteWebcamInfo);
				} else if (params.appData.target === 'share') {
					if (this.shareProducer) {
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

					this.world.getGraphicsWorld().add(remoteShareScreen);

					// destructure and retrieve the video track from the producer
					const { track } = consumer;
					const remoteShare = document.getElementById(
						remoteProducerId + '-video',
					) as HTMLMediaElement;
					remoteShare.srcObject = new MediaStream([track]);

					this.remoteShareKeyList.push(remoteProducerId);

					const remoteShareInfo: RemoteShareInfo = {
						remoteShareSocketId: socketId,
						remoteShare: remoteShare,
						remoteShareImage: remoteShareImage,
						remoteShareImageContext: remoteShareImageContext,
						remoteShareTexture: remoteShareTexture,
						remoteShareScreen: remoteShareScreen,
					};

					this.remoteShareMap.set(remoteProducerId, remoteShareInfo);
				}

				// the server consumer started with media paused
				// so we need to inform the server to resume
				this.mediasoupSocket.emit('consumer-resume', {
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

		if (this.micProducer) return;

		this.micProducer = await this.producerTransport.produce(this.micParams);

		this.micProducer.on('trackended', () => {
			console.log('audio track ended');
		});

		this.micProducer.on('transportclose', () => {
			console.log('audio transport ended');
		});
	};

	public unmuteMic = async () => {
		console.log('unmuteMic()');
		try {
			this.micProducer.resume();
			await this.mediasoupSocket.emit('resumeProducer', {
				producerId: this.micProducer.id,
			});
		} catch (error) {
			console.error('unmuteMic() | failed: %o', error);
		}
	};

	public muteMic = async (): Promise<boolean> => {
		console.log('muteMic()');
		try {
			this.micProducer.pause();
			await this.mediasoupSocket.emit('pauseProducer', {
				producerId: this.micProducer.id,
			});
			return true;
		} catch (error) {
			console.error('muteMic() | failed: %o', error);
			return false;
		}
	};

	public enableWebcam = async () => {
		console.log('enableWebcam()');
		if (this.webcamProducer) return;

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
					this.localWebcam = document.getElementById(
						'local-webcam',
					) as HTMLVideoElement;
					this.localWebcam.srcObject = stream;

					this.localWebcamImage = document.getElementById(
						'local-webcam-image',
					) as HTMLCanvasElement;
					this.localWebcamImageContext = this.localWebcamImage.getContext('2d');

					// background color if no video present
					this.localWebcamImageContext.fillStyle = '#000000';
					this.localWebcamImageContext.fillRect(
						0,
						0,
						this.localWebcamImage.width,
						this.localWebcamImage.height,
					);

					this.localWebcamTexture = new THREE.Texture(this.localWebcamImage);
					this.localWebcamTexture.minFilter = THREE.LinearFilter;
					this.localWebcamTexture.magFilter = THREE.LinearFilter;

					const movieMaterial = new THREE.MeshBasicMaterial({
						map: this.localWebcamTexture,
						side: THREE.DoubleSide,
					});
					// the geometry on which the movie will be displayed;
					// movie image will be scaled to fit these dimensions.
					const movieGeometry = new THREE.PlaneGeometry(1, 0.5, 0.1, 0.1);
					this.localWebcamScreen = new THREE.Mesh(movieGeometry, movieMaterial);
					const avatar = this.world.getUserAvatar();
					this.localWebcamScreen.position.set(
						avatar.position.x,
						avatar.position.y + 1.7,
						avatar.position.z,
					);

					this.world.getGraphicsWorld().add(this.localWebcamScreen);

					this.webcamParams = {
						track: stream.getVideoTracks()[0],
						...this.webcamDefalutParams,
					};

					this.webcamProducer = await this.producerTransport.produce(
						this.webcamParams,
					);

					this.webcamProducer.on('transportclose', () => {
						this.webcamProducer = null;
					});
					this.webcamProducer.on('trackended', () => {
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
		if (!this.webcamProducer) return;

		this.webcamProducer.close();
		try {
			await this.mediasoupSocket.emit('closeProducer', {
				producerId: this.webcamProducer.id,
			});
			this.world.getGraphicsWorld().remove(this.localWebcamScreen);
		} catch (error) {
			console.error(`Error closing server-side webcam Producer: ${error}`);
		}
		this.webcamProducer = null;
	};

	public enableShare = async (): Promise<boolean> => {
		return new Promise<boolean>(
			(resolve: (value: boolean) => void, reject: (error: boolean) => void) => {
				console.log('enableShare()');
				if (this.shareProducer) return reject(false);
				if (this.remoteShareKeyList.length > 0) {
					alert('이미 다른사람이 화면공유 중 입니다.');
					return reject(false);
				}

				// if (this.remoteShareKeyList.length > 1) {
				// 	this.remoteShareKeyList.forEach(async (remoteShareKey) => {
				// 		try {
				// 			await this.mediasoupSocket.emit('closeProducer', {
				// 				producerId: remoteShareKey,
				// 			});
				// 		} catch (error) {
				// 			console.error(`Error closing server-side webcam Producer: ${error}`);
				// 		}
				// 	});
				// }
				// if (!this._mediasoupDevice.canProduce('video')) {
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
							this.localShare = document.getElementById(
								'local-share',
							) as HTMLVideoElement;
							this.localShare.srcObject = stream;

							this.localShareImage = document.getElementById(
								'local-share-image',
							) as HTMLCanvasElement;
							this.localShareImageContext =
								this.localShareImage.getContext('2d');

							// background color if no video present
							this.localShareImageContext.fillStyle = '#000000';
							this.localShareImageContext.fillRect(
								0,
								0,
								this.localShareImage.width,
								this.localShareImage.height,
							);

							this.localShareTexture = new THREE.Texture(this.localShareImage);
							this.localShareTexture.minFilter = THREE.LinearFilter;
							this.localShareTexture.magFilter = THREE.LinearFilter;

							const movieMaterial = new THREE.MeshBasicMaterial({
								map: this.localShareTexture,
								side: THREE.DoubleSide,
							});
							// the geometry on which the movie will be displayed;
							// movie image will be scaled to fit these dimensions.
							const movieGeometry = new THREE.PlaneGeometry(3.25, 1.5, 1, 1);
							this.localShareScreen = new THREE.Mesh(
								movieGeometry,
								movieMaterial,
							);
							this.localShareScreen.position.set(0, 1.6, -1.325);

							this.localShareScreen.rotation.set(0, 3.145, 0);

							this.world.getGraphicsWorld().add(this.localShareScreen);

							this.shareParams = {
								track: stream.getVideoTracks()[0],
								...this.shareDefalutParams,
							};

							this.shareProducer = await this.producerTransport.produce(
								this.shareParams,
							);

							this.shareProducer.on('transportclose', () => {
								this.shareProducer = null;
							});
							this.shareProducer.on('trackended', () => {
								console.log('share disconnected!');
								document.dispatchEvent(new Event('stop-share-event'));
							});

							return resolve(true);
						})
						.catch((error) => {
							console.log(error.message);
							return reject(false);
						});

					// if (!this._externalVideo) {
					//     stream = await this._worker.getUserMedia({
					//         video: { source: 'device' }
					//     });
					// }
					// else {
					//     stream = await this._worker.getUserMedia({
					//         video: {
					//             source: this._externalVideo.startsWith('http') ? 'url' : 'file',
					//             file: this._externalVideo,
					//             url: this._externalVideo
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
					//     id: this._webcamProducer.id,
					//     deviceLabel: device.label,
					//     type: this._getWebcamType(device),
					//     paused: this._webcamProducer.paused,
					//     track: this._webcamProducer.track,
					//     rtpParameters: this._webcamProducer.rtpParameters,
					//     codec: this._webcamProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
					// }));
					//webcamProducer.on('transportclose', () => {
					//    webcamProducer = null;
					//});
					//webcamProducer.on('trackended', () => {
					//    console.log('Webcam disconnected!');
					// this.disableWebcam()
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
					if (!this.shareProducer) return;
					this.shareProducer.close();

					await this.mediasoupSocket.emit('closeProducer', {
						producerId: this.shareProducer.id,
					});
					this.shareProducer = null;
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
			this.localWebcam &&
			this.localWebcam.readyState === this.localWebcam.HAVE_ENOUGH_DATA
		) {
			const avatar = this.world.getUserAvatar();

			if (avatar.parent instanceof Chair) {
				const userEnteredChair: Chair = avatar.parent;

				this.localWebcamImageContext.drawImage(
					this.localWebcam,
					0,
					0,
					this.localWebcamImage.width,
					this.localWebcamImage.height,
				);
				if (this.localWebcamTexture) {
					this.localWebcamTexture.needsUpdate = true;
					this.localWebcamScreen.position.set(
						userEnteredChair.position.x,
						userEnteredChair.position.y + 2.2,
						userEnteredChair.position.z,
					);
					this.localWebcamScreen.rotation.copy(userEnteredChair.rotation);
				}
			} else {
				this.localWebcamImageContext.drawImage(
					this.localWebcam,
					0,
					0,
					this.localWebcamImage.width,
					this.localWebcamImage.height,
				);
				if (this.localWebcamTexture) {
					this.localWebcamTexture.needsUpdate = true;
					this.localWebcamScreen.position.set(
						avatar.position.x,
						avatar.position.y + 1.7,
						avatar.position.z,
					);
					this.localWebcamScreen.rotation.copy(avatar.rotation);
				}
			}
		}

		if (
			this.localShare &&
			this.localShare.readyState === this.localShare.HAVE_ENOUGH_DATA
		) {
			this.localShareImageContext.drawImage(
				this.localShare,
				0,
				0,
				this.localShareImage.width,
				this.localShareImage.height,
			);
			if (this.localShareTexture) {
				this.localShareTexture.needsUpdate = true;
			}
		}

		if (this.remoteWebcamKeyList.length > 0) {
			this.remoteWebcamKeyList.forEach((remoteWebcamKey) => {
				const remoteWebcamInfo: RemoteWebcamInfo =
					this.remoteWebcamMap.get(remoteWebcamKey);

				const targetAvatar = this.world.getTargetAvatar(
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

		if (this.remoteShareKeyList.length > 0) {
			this.remoteShareKeyList.forEach((remoteShareKey) => {
				const remoteShareInfo: RemoteShareInfo =
					this.remoteShareMap.get(remoteShareKey);

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

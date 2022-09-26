import styles from './Room.module.css';
import { World } from '../../systems/world/World';
import Footer from './Footer';
import LoadingScreen from './LoadingScreen';
import UiContainer from './UiContainer';
import { createBrowserHistory } from 'history';
import { useNavigate } from 'react-router-dom';
import screenfull from 'screenfull';
import { useEffect, useState } from 'react';

function Room() {
	const [world, setWorld] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isUiContainerOn, setUiContainerOn] = useState(false);

	useEffect(() => {
		setWorld(new World('/assets/metaverse_afterparty_comp.glb'));

		document.addEventListener('loading-screen-event', function () {
			setIsLoading(false);
			setUiContainerOn(true);
		});
	}, []);

	const history = createBrowserHistory();
	const navigate = useNavigate();

	const unlistenHistoryEvent = history.listen(({ action }) => {
		if (action === 'POP') {
			listenBackEvent();
		}
	});

	const listenBackEvent = () => {
		//world.stopRendering();
		//world.disconnectPhoenixAdapter();

		const canvas = document.getElementsByTagName(
			'canvas',
		)[0] as HTMLCanvasElement;
		if (canvas) canvas.parentNode.removeChild(canvas);

		navigate('/');
	};

	const getWorld = (): World => {
		return world;
	};

	const test = () => {
		screenfull.request();
	};

	return (
		<>
			<audio
				id="local-audio"
				autoPlay
				className={styles.audio}
				style={{ display: 'none' }}
				muted
			></audio>
			<video
				id="local-webcam"
				autoPlay
				className={styles.video}
				width="640"
				height="360"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
				muted
			></video>
			<canvas
				id="local-webcam-image"
				width="640"
				height="360"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
			></canvas>
			<video
				id="local-share"
				autoPlay
				className={styles.video}
				width="640"
				height="360"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
				muted
			></video>
			<canvas
				id="local-share-image"
				width="640"
				height="360"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
			></canvas>
			<video
				id="local-video"
				className={styles.video}
				autoPlay
				width="1280"
				height="720"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
			></video>
			<canvas
				id="local-video-image"
				width="1280"
				height="720"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
			></canvas>
			<div id="remote-producer-container"></div>
			<LoadingScreen isLoading={isLoading} />
			<UiContainer isLoading={isLoading} isUiContainerOn={isUiContainerOn} />
			<Footer
				isLoading={isLoading}
				getWorld={getWorld}
				isUiContainerOn={isUiContainerOn}
				setUiContainerOn={setUiContainerOn}
			/>
		</>
	);
}

export default Room;

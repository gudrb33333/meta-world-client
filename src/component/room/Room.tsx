import './Room.css';
import { World } from '../../systems/world/World';
import Footer from './Footer';
import LoadingScreen from './LoadingScreen';
import UiContainer from './UiContainer';
import { createBrowserHistory } from 'history';
import { useNavigate } from 'react-router-dom';
import screenfull from 'screenfull';

function Room() {
	const world = new World('/assets/test22222.glb');

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

	const test = () =>{
		screenfull.request();
	}

	return (
		<>
			<audio
				id="local-audio"
				autoPlay
				className="audio"
				style={{ display: 'none' }}
				muted
			></audio>
			<video
				id="local-webcam"
				autoPlay
				className="video"
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
				className="video"
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
			<div id="remote-producer-container"></div>
			<LoadingScreen world={world} />
			<UiContainer world={world} />
			<Footer world={world} />
		</>
	);
}

export default Room;

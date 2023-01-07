import styles from './Room.module.css';
import { World } from '../../systems/world/World';
import Footer from './Footer';
import LoadingScreen from './LoadingScreen';
import UiContainer from './UiContainer';
import { createBrowserHistory } from 'history';
import { useNavigate } from 'react-router-dom';
import screenfull from 'screenfull';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';

function Room() {
	const [world, setWorld] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isUiContainerOn, setUiContainerOn] = useState(false);

	const history = createBrowserHistory();

	useEffect(() => {
		(async function () {
			try {
				const qs = new URLSearchParams(location.search);
				if (qs.get('user-type') === 'guest') {
					sessionStorage.setItem(
						'avatar_url',
						'/assets/male/readyDefaultMaleAvatar.glb',
					);
					sessionStorage.setItem('avatar_name', '손님');
				} else {
					const res = await axios.get('/api/v1/profiles/me');
					sessionStorage.setItem('avatar_url', res.data.signedAvatarUrl);
					sessionStorage.setItem('avatar_name', res.data.nickname);
				}

				setWorld(
					new World('/assets/virtual_reality_space_mountain_view_room.glb'),
				);

				document.addEventListener('loading-screen-event', function () {
					setIsLoading(false);
					setUiContainerOn(true);
				});

				history.listen(({ action }) => {
					if (action === 'POP') {
						listenBackEvent();
					}
				});
			} catch (error) {
				if (error.response.status === 404) {
					if (confirm('아바타가 없습니다. 아바타 생성 페이지로 이동 합니다.')) {
						window.location.href = '/avatar';
					}
				} else if (error.response.status === 403) {
					alert('로그인 정보가 없습니다. 로그인을 다시 해주세요.');
					window.location.href = '/';
				} else {
					alert('알 수 없는 에러가 발생했습니다.');
					window.location.href = '/';
				}
			}
		})();
	}, []);

	const listenBackEvent = () => {
		window.location.replace('/');
	};

	const getWorld = (): World => {
		return world;
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
				width="1600"
				height="900"
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
			<LoadingScreen isLoading={isLoading} />
			<UiContainer isLoading={isLoading} isUiContainerOn={isUiContainerOn} />
			<Footer
				isLoading={isLoading}
				getWorld={getWorld}
				isUiContainerOn={isUiContainerOn}
				setUiContainerOn={setUiContainerOn}
			/>
			<Sidebar getWorld={getWorld} />
		</>
	);
}

export default Room;

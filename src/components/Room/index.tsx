import styles from './style.module.css';
import { World } from '../../systems/world/World';
import Footer from '../RoomFooter';
import LoadingScreen from '../LoadingScreen';
import UiContainer from '../UiContainer';
import { createBrowserHistory } from 'history';
import { useEffect, useState } from 'react';
import Sidebar from '../RoomSidebar';
import { findMyProfile } from '../../api/profile';
import { useNavigate, useParams } from 'react-router-dom';
import RoomInitModal from '../RoomInitModal';

function Room() {
	const { roomName } = useParams();

	const [world, setWorld] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isUiContainerOn, setUiContainerOn] = useState(false);
	const navigate = useNavigate();

	const history = createBrowserHistory();

	useEffect(() => {
		(async function () {
			const qs = new URLSearchParams(location.search);
			if (qs.get('user-type') === 'guest') {
				sessionStorage.setItem(
					'avatar_url',
					'/assets/male/readyDefaultMaleAvatar.glb',
				);
				sessionStorage.setItem('avatar_name', '손님');
			} else {
				try {
					const data = await findMyProfile();
					sessionStorage.setItem('avatar_url', data.signedAvatarUrl);
					sessionStorage.setItem('avatar_name', data.nickname);
				} catch (error) {
					if (error.response.status === 401) {
						alert('권한이 없습니다. 다시 로그인 해주세요.');
						navigate('/');
					} else if (error.response.status === 404) {
						alert('생성된 프로필이 없습니다. 프로필 생성 페이지로 이동합니다.');
						navigate('/avatar');
					} else {
						alert('알 수 없는 에러로 프로필 조회를 실패했습니다.');
						navigate('/');
					}
				}
			}

			if (roomName === 'public-room') {
				setWorld(
					new World({
						worldScenePath: `/assets/${roomName}.glb`,
						roomName: roomName,
						avatarAdjustValue: 1,
						lightValue: 5,
						needBloom: null,
						localVideoSrc: null,
						needAudioFrequencyData: null
					})
				)
			} else if(roomName === 'after-party') {
				setWorld(
				new World({
					worldScenePath: `/assets/${roomName}.glb`,
					roomName: roomName,
					avatarAdjustValue: 0.6,
					lightValue: 0.1,
					needBloom: true,
					localVideoSrc: '/assets/NewJeans.mp4',
					needAudioFrequencyData: true
				})
				)
			} else {
				alert("그런 이름의 방이 없습니다.");
				window.location.replace('/');
			}

			document.addEventListener('loading-screen-event', function () {
				setIsLoading(false);
				setUiContainerOn(true);
			});

			history.listen(({ action }) => {
				if (action === 'POP') {
					listenBackEvent();
				}
			});
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
						<video
				id="local-video"
				className={styles.video}
				autoPlay
				width="1280"
				height="720"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
				playsInline
			></video>
			<canvas
				id="local-video-image"
				width="1280"
				height="720"
				style={{ visibility: 'hidden', float: 'left', position: 'absolute' }}
			></canvas>
			<div id="remote-producer-container"></div>
			<LoadingScreen isLoading={isLoading} />
			<RoomInitModal 
				isLoading={isLoading}
				getWorld={getWorld}
			/>
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

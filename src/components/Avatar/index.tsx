import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findMe } from '../../api/member';
import '../../App.css';
import styles from './style.module.css';
import AvatarGuideModal from '../AvatarGuideModal';
import AvatarNameModal from '../AvatarNameModal';

function Avatar() {
	const subdomain = 'demo'; // See section about becoming a partner
	const showIFrame = true;
	const iFrameRef = useRef(null);
	const [isNameModalOn, setIsNameModalOn] = useState(false);
	const [isGuideModalOn, setIsGuideModalOn] = useState(true);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const navigate = useNavigate();

	const subscribe = async (event) => {
		const json = parse(event);
		if (json?.source !== 'readyplayerme') {
			return;
		}
		// Subscribe to all events sent from Ready Player Me
		// once frame is ready
		if (json.eventName === 'v1.frame.ready') {
			const iFrame = iFrameRef.current;
			if (iFrame && iFrame.contentWindow) {
				iFrame.contentWindow.postMessage(
					JSON.stringify({
						target: 'readyplayerme',
						type: 'subscribe',
						eventName: 'v1.**',
					}),
					'*',
				);
			}
		}
		// Get avatar GLB URL
		if (json.eventName === 'v1.avatar.exported') {
			setAvatarUrl(json.data.url);
			setIsNameModalOn(true);
		}
		// Get user id
		if (json.eventName === 'v1.user.set') {
			console.log(`User with id ${json.data.id} set:
    		${JSON.stringify(json)}`);
		}
	};

	const parse = (event) => {
		try {
			return JSON.parse(event.data);
		} catch (error) {
			return null;
		}
	};

	const closeNameModal = () => {
		location.reload();
	};

	const openGuideModal = () => {
		setIsGuideModalOn(true);
	};

	const closeGuideModal = () => {
		setIsGuideModalOn(false);
	};

	useEffect(() => {
		const iFrame = iFrameRef.current;
		if (iFrame) {
			iFrame.src = `https://${subdomain}.readyplayer.me/avatar?frameApi&clearCache&bodyType=fullbody`;
		}

		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}, []);

	useEffect(() => {
		const resizeCallback = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		};

		window.addEventListener('message', subscribe);
		document.addEventListener('message', subscribe);
		window.addEventListener('resize', resizeCallback);
		return () => {
			window.removeEventListener('message', subscribe);
			document.removeEventListener('message', subscribe);
			window.removeEventListener('resize', resizeCallback);
		};
	});

	useEffect(() => {
		(async function () {
			try {
				await findMe();
			} catch (error) {
				if (error.response.status == 401) {
					alert('로그인 정보가 없습니다. 다시 로그인 해주세요.');
					navigate('/');
				} else {
					alert('알 수 없는 에러가 발생했습니다.');
					navigate('/');
				}
			}
		})();
	}, []);

	return (
		<div className={styles.avatar}>
			<div
				className={styles.guide}
				style={{ display: isNameModalOn ? 'none' : 'block' }}
			>
				<button
					className={styles.avatarGuideInfoButton}
					onClick={openGuideModal}
				>
					가이드 열기
				</button>
			</div>
			<iframe
				allow="camera *; microphone *"
				className={styles.iFrame}
				id={styles.frame}
				ref={iFrameRef}
				style={{
					display: `${showIFrame ? 'block' : 'none'}`,
				}}
				title={'Ready Player Me'}
			/>
			<AvatarNameModal
				isNameModalOn={isNameModalOn}
				close={closeNameModal}
				avatarUrl={avatarUrl}
			/>
			<AvatarGuideModal
				isGuideModalOn={isGuideModalOn}
				close={closeGuideModal}
			/>
		</div>
	);
}

export default Avatar;

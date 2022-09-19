import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import styles from './Avatar.module.css';
import AvatarGuideModal from './AvatarGuideModal';
import AvatarNameModal from './AvatarNameModal';

function Avatar() {
	const subdomain = 'demo'; // See section about becoming a partner
	const iFrameRef = useRef(null);
	const navigate = useNavigate();
	const [showIFrame, setShowIFrame] = useState(true);
	const [isOpenNameModal, setIsOpenNameModal] = useState(false);
	const [isGuideModalOn, setIsGuideModalOn] = useState(true);

	useEffect(() => {
		const iFrame = iFrameRef.current;
		if (iFrame) {
			iFrame.src = `https://${subdomain}.readyplayer.me/avatar?frameApi`;
		}

		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	},[]);
	useEffect(() => {

		const resizeCallback = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		}

		window.addEventListener('message', subscribe);
		document.addEventListener('message', subscribe);
		window.addEventListener('resize', resizeCallback)
		return () => {
			window.removeEventListener('message', subscribe);
			document.removeEventListener('message', subscribe);
			window.removeEventListener('resize', resizeCallback)
		};
	});

	const subscribe = (event) => {
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
			setIsOpenNameModal(true);
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
	}

	const closeGuideModal = () => {
		setIsGuideModalOn(false);
	}

	return (
		<div className={styles.avatar}>
			<div className={styles.guide} style={{ display: isOpenNameModal ? 'none' : 'block' }}> 
				<button className={styles.avatarGuideInfoButton} onClick={openGuideModal} >
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
			<AvatarNameModal isOpenNameModal={isOpenNameModal} close={closeNameModal} />
			<AvatarGuideModal isGuideModalOn={isGuideModalOn} close={closeGuideModal}/>
		</div>
	);
}

export default Avatar;

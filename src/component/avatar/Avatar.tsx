import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import styles from './Avatar.module.css';
import AvatarNameModal from './AvatarNameModal';

function Avatar() {
	const subdomain = 'demo'; // See section about becoming a partner
	const iFrameRef = useRef(null);
	const navigate = useNavigate();
	const [showIFrame, setShowIFrame] = useState(true);
	const [isOpenModal, setIsOpenModal] = useState(false);

	useEffect(() => {
		const iFrame = iFrameRef.current;
		if (iFrame) {
			iFrame.src = `https://${subdomain}.readyplayer.me/avatar?frameApi`;
		}
	},[]);
	useEffect(() => {
		window.addEventListener('message', subscribe);
		document.addEventListener('message', subscribe);
		return () => {
			window.removeEventListener('message', subscribe);
			document.removeEventListener('message', subscribe);
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
			setIsOpenModal(true);
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

	const closeModal = () => {
		location.reload();
	};

	return (
		<div className={styles.avatar}>
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
			<AvatarNameModal isOpenModal={isOpenModal} close={closeModal} />
		</div>
	);
}

export default Avatar;

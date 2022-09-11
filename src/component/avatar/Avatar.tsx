import { useEffect, useRef, useState } from 'react';
import '../../App.css';
import './Avatar.css';
import AvatarNameModal from './AvatarNameModal';

function Avatar() {
	const subdomain = 'demo'; // See section about becoming a partner
	const iFrameRef = useRef(null);
	const [avatarUrl, setAvatarUrl] = useState('');
	const [showIFrame, setShowIFrame] = useState(true);
	const [isOpenModal, setIsOpenModal] = useState(false);

	useEffect(() => {
		const iFrame = iFrameRef.current;
		if (iFrame) {
			iFrame.src = `https://${subdomain}.readyplayer.me/avatar?frameApi`;
		}
	});
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
			console.log(`Avatar URL: ${json.data.url}`);
			localStorage.setItem('avatar_url', json.data.url);
			setAvatarUrl(json.data.url);
			//setShowIFrame(false);
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
		setIsOpenModal(false);
	};

	return (
		<div className="avatar">
			<iframe
				allow="camera *; microphone *"
				className="iFrame"
				id="frame"
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

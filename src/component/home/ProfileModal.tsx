import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import classNames from 'classnames';
import styles from './ProfileModal.module.css';
import { useNavigate } from 'react-router-dom';
import { ProfileCanvas } from '../../systems/world/ProfileCanvas';

function ProfileModal(props) {
	const [isModalOn, setIsModalOn] = useState(false);
	const [nickname, setNickname] = useState('');
	const [profileCanvas, setProfileCanvas] = useState(null);
	const navigate = useNavigate();

	const afterOpenModal = async () => {
		if (props.isModalOn) {
			const data = await findProfile();
			setNickname(data.nickname);
			setProfileCanvas(new ProfileCanvas(data.signedAvatarUrl));
		}
	};

	const closeModal = () => {
		profileCanvas.stopRendering();
		setProfileCanvas(null);
		props.close();
	};

	useEffect(() => {
		setIsModalOn(props.isModalOn);
	}, [props.isModalOn]);

	const findProfile = async () => {
		try {
			return (await axios.get('/api/v1/profiles/me')).data;
		} catch (error) {
			if (error.response.status === 404) {
				if (confirm('아바타가 없습니다. 아바타 생성 페이지로 이동 합니다.')) {
					navigate('/avatar');
				} else {
					props.close();
				}
			} else if (error.response.status === 403) {
				alert('권한이 없습니다. 로그인을 다시 해주세요.');
				props.close();
			} else {
				alert('알 수 없는 에러가 발생했습니다.');
				props.close();
			}
		}
	};

	const navigateHandler = () => {
		navigate('/room')
	}

	return (
		<Modal
			isOpen={isModalOn}
			className={styles.profileModal}
			ariaHideApp={false}
			onAfterOpen={afterOpenModal}
			style={{
				overlay: {
					position: 'fixed',
					top: 50,
					left: 440,
					right: 440,
					bottom: 50,
					backgroundColor: 'rgba(255, 255, 255, 0.1)',
				},
				content: {
					position: 'absolute',
					background: '#80807f',
					overflow: 'auto',
					WebkitOverflowScrolling: 'touch',
					outline: 'none',
					padding: '2px',
					fontFamily: 'Poppins, sans-serif',
					color: '#f3f0ef',
					borderRadius: '12px',
					backgroundColor: '#2a2d44',
					border: '1px solid #414361',
					textAlign: 'center',
				},
			}}
		>
			<header>프로필</header>
			<div id="profile-container" className={styles.content}></div>
			<input disabled value={nickname}></input>
			<button
				type="button"
				className={classNames([styles.close, styles.profileInfoButton])}
				onClick={navigateHandler}
			>
				공간으로 접속
			</button>
			<button
				type="button"
				className={classNames([styles.close, styles.profileInfoButton])}
				onClick={closeModal}
			>
				닫기
			</button>
		</Modal>
	);
}

export default ProfileModal;

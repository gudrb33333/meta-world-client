import classNames from 'classnames';
import styles from './style.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { logout } from '../../api/auth';
import axios from 'axios';
import ProfileModal from '../ProfileModal';
import Card from '../Card';

function RoomLobby() {
    const movePage = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [profileModalType, setProfileModalType] = useState('');
	const [isProfileModalOn, setIsProfileModalOn] = useState(false);

	useEffect(() => {
		axios.get('/api/v1/members/me').then(
			() => {
				setIsLoggedIn(true);
			},
			() => {
				setIsLoggedIn(false);
				alert('로그아웃 되었습니다. 다시 로그인해 주세요');
				movePage('/');
			},
		);
	}, []);

	const logoutHandler = async () => {
		try {
			await logout();
			movePage('/');
		} catch (error) {
			if (error.response.status == 401) {
				alert('이미 로그아웃 되었습니다.');
				movePage('/');
			}
		}
	};

    const openProfileModal = () => {
		setIsProfileModalOn(true)
	};

    const closeProfileModal = () => {
		setIsProfileModalOn(false);
	};
    

    return(
        <div className={classNames([styles.roomLobby, styles.fadeIn])}>
			<div className={styles.roomLobbyContent}>
				<div className={styles.roomLobbyCardContainer}>
					<Card
						title='쇼핑몰'
						imageUrl='/assets/images/shopping-mall-thumbnail.png'
						body='&nbsp;쇼핑몰에서 옷도 구경하고 테이블에 앉아서 화상채팅도 해보세요.'
						roomUrl={`/rooms/shopping-mall${profileModalType}`}
					/>
					<Card
						title='공연장'
						imageUrl='/assets/images/after-party-thumbnail.png'
						body='&nbsp;조명이 있는 공연장에서 친구들과 비디오 감상을 해보세요.'
						roomUrl={`/rooms/after-party${profileModalType}`}
					/>
				</div>
				<div className={styles.roomLobbyButtonContainer}>
					<button
						className={classNames([
							styles.roomLobbyRedBlockButton,
							styles.pushable,
							styles.slideInLeft,
						])}
						onClick={openProfileModal}
					>
						<span className={styles.shadow}></span>
						<span className={styles.edge}></span>
						<span className={styles.front}>프로필</span>
					</button>
					{isLoggedIn && (
					  <button
					    className={classNames([
					      styles.roomLobbyRedBlockButton,
					      styles.pushable,
					      styles.slideInLeft,
					    ])}
					    onClick={logoutHandler}
					  >
					    <span className={styles.shadow}></span>
					    <span className={styles.edge}></span>
					    <span className={styles.front}>로그아웃</span>
					  </button>
					)}
					<ProfileModal
						isModalOn={isProfileModalOn}
						isLoggedIn={isLoggedIn}
						close={closeProfileModal}
					/>
				</div>
			</div>
		</div>
    );
}

export default RoomLobby;

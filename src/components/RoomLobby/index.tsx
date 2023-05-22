import classNames from 'classnames';
import styles from './style.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { logout } from '../../api/auth';
import axios from 'axios';
import ProfileModal from '../ProfileModal';
import Card from '../Card';
import PushableButton from '../PushableButton';

function RoomLobby() {
    const movePage = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [profileModalType, setProfileModalType] = useState('');
	const [isProfileModalOn, setIsProfileModalOn] = useState(false);

	useEffect(() => {
		const qs = new URLSearchParams(location.search);
		if (qs.get('user-type') === 'guest') {
			setProfileModalType('?user-type=guest');
			return;
		}

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
					<PushableButton
							content='프로필'
							slideDirection='slideInLeft'
							onClick={openProfileModal}
					/>
					{isLoggedIn && (
						<PushableButton
							content='로그아웃'
							slideDirection='slideInRight'
							onClick={logoutHandler}
						/>
					)}
					<ProfileModal
						isModalOn={isProfileModalOn}
						isLoggedIn={isLoggedIn}
						profileModalType={profileModalType}
						close={closeProfileModal}
					/>
				</div>
			</div>
		</div>
    );
}

export default RoomLobby;

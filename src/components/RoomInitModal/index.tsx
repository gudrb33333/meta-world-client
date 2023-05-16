import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import styles from './style.module.css';
import classNames from 'classnames';

import screenfull from 'screenfull';
import checkIsMobile from '../../utils/isMobile';
import { ProfileCanvas } from '../../systems/world/ProfileCanvas';
import { deleteProfile, findMyProfile } from '../../api/profile';

import { Joystick } from '../../systems/core/Joystick';

export default function RoomInitModal(props) {
    const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [nickname, setNickname] = useState('');
	const [profileCanvas, setProfileCanvas] = useState(null);

	useEffect(() => {
		setIsLoading(props.isLoading);
	}, [props.isLoading]);

    const closeModal = () => {
        const world = props.getWorld();
        profileCanvas.stopRendering();
		setProfileCanvas(null);

        if (checkIsMobile() && screenfull.isEnabled) {
            screenfull.request();
            new Joystick(world, world._inputManager);
        }

        setIsModalOpen(false);
	};

    const afterOpenModal = async () => {
        const qs = new URLSearchParams(location.search);
        if (qs.get('user-type') === 'guest') {
            setNickname(sessionStorage.getItem("avatar_name"));
            setProfileCanvas(new ProfileCanvas(sessionStorage.getItem("avatar_url")));
            return;
        }

		if (isModalOpen) {
			try {
				const data = await findMyProfile();
				setNickname(data.nickname);
				setProfileCanvas(new ProfileCanvas(data.signedAvatarUrl));
			} catch (error) {
				if (error.response.status === 401) {
					alert('권한이 없습니다. 다시 로그인 해주세요.');
					props.close();
				} else if (error.response.status === 404) {
					if (
						confirm('생성된 프로필이 없습니다. 프로필 생성으로 이동합니다.')
					) {
						navigate('/avatar');
					} else {
						props.close();
					}
				} else {
					alert('알 수 없는 에러로 프로필 조회를 실패했습니다.');
					props.close();
				}
			}
		}
	};

    return (
        <Modal
            isOpen={!isLoading && isModalOpen}
            className={styles.roomInitModal}
            ariaHideApp={false}
            onAfterOpen={afterOpenModal}
            style={{
                overlay: {
                    position: 'fixed',
                    top: 30,
                    left: 0,
                    right: 0,
                    bottom: 30,
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
            <table className={styles.roomInitModalTable}>
				<thead className={styles.roomInitModalTableThead}>프로필</thead>
				<tbody>
					<tr>
						<td>
							<div
								id="profile-container"
								className={styles.roomInitModalAvatarContent}
							>
							</div>
						</td>
					</tr>
					<tr>
						<td>
							<h3 className={styles.profileText}>
								<div className={styles.title}>닉네임</div>
								<input
									className={styles.roomInitModalInput}
									disabled
									value={nickname}
								></input>
							</h3>
						</td>
					</tr>
					<tr>
						<td>
							<button
								type="button"
								className={classNames([styles.close, styles.roomInitModalButton])}
								onClick={closeModal}
							>
								닫기
							</button>
						</td>
					</tr>
				</tbody>
			</table>
        </Modal>
    );
} 
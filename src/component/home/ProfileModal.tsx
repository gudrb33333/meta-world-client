import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import classNames from 'classnames';
import styles from './ProfileModal.module.css';
import { useNavigate } from 'react-router-dom';
import { ProfileCanvas } from '../../systems/world/ProfileCanvas';
import { deleteProfile, findMyProfile } from '../../api/profile';

function ProfileModal(props) {
	const [isModalOn, setIsModalOn] = useState(false);
	const [nickname, setNickname] = useState('');
	const [profileCanvas, setProfileCanvas] = useState(null);
	const navigate = useNavigate();

	const afterOpenModal = async () => {
		if (props.isModalOn) {
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

	const closeModal = () => {
		profileCanvas.stopRendering();
		setProfileCanvas(null);
		props.close();
	};

	useEffect(() => {
		setIsModalOn(props.isModalOn);
	}, [props.isModalOn]);

	const navigateHandler = async () => {
		profileCanvas.stopRendering();
		setProfileCanvas(null);
		navigate('/room');
	};

	const changeProfileHandler = () => {
		navigate('/avatar?edit-mode');
	};

	const deleteProfileHandler = async () => {
		try {
			await deleteProfile();
			confirm('프로필을 성공적으로 삭제했습니다.');
			setNickname('');
			props.close();
		} catch (error) {
			if (error.response.status === 404) {
				alert('삭제할 프로필을 찾지 못했습니다.');
				props.close();
			} else if (error.response.status === 401) {
				alert('권한이 없습니다. 로그인을 다시 해주세요.');
				props.close();
			} else {
				alert('알 수 없는 에러가 발생했습니다.');
				props.close();
			}
		}
	};

	return (
		<Modal
			isOpen={isModalOn}
			className={styles.profileModal}
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
			<table className={styles.profileInfoTable}>
				<thead className={styles.profileThead}>프로필</thead>
				<tbody>
					<tr>
						<td>
							<div
								id="profile-container"
								className={styles.profileAvatarContent}
							>
							</div>
							<button
								type="button"
								className={classNames([styles.close, styles.profileEnterButton])}
								onClick={navigateHandler}
							>
								공간으로 접속
							</button>
						</td>
					</tr>
					<tr>
						<td>
							<h3 className={styles.profileText}>
								<div className={styles.title}>닉네임</div>
								<input
									className={styles.profileInput}
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
								className={classNames([styles.close, styles.profileInfoButton])}
								onClick={changeProfileHandler}
							>
								아바타 변경
							</button>
							<button
								type="button"
								className={classNames([styles.close, styles.profileInfoButton])}
								onClick={deleteProfileHandler}
							>
								아바타 삭제
							</button>
							<button
								type="button"
								className={classNames([styles.close, styles.profileInfoButton])}
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

export default ProfileModal;

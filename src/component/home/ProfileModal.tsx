import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
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
			const data = await findMyProfile();

			if(data){
				setNickname(data.nickname);
				setProfileCanvas(new ProfileCanvas(data.signedAvatarUrl));
			}else {
				props.close();
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
		const data = await deleteProfile();

		if(data) {
			confirm('프로필을 성공적으로 삭제했습니다.');
			setNickname('');
			props.close();
		} else {
			props.close();
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
							></div>
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
								onClick={navigateHandler}
							>
								공간으로 접속
							</button>
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

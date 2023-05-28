import { useState } from 'react';
import Modal from 'react-modal';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';
import { ProfileCanvas } from '../../systems/world/ProfileCanvas';
import { deleteProfile, findMyProfile } from '../../api/profile';
import checkIsMobile from '../../utils/isMobile';
import ModalButton from '../ModalButton';

interface ProfileModalProps {
	isModalOn: boolean;
	isLoggedIn: boolean;
	profileModalType: string;
	close: () => void;
}

function ProfileModal({
	isModalOn,
	isLoggedIn,
	profileModalType,
	close,
}: ProfileModalProps): JSX.Element {
	const [nickname, setNickname] = useState('');
	const [, setProfileCanvas] = useState(null);
	const navigate = useNavigate();

	const afterOpenModal = async () => {
		if (isModalOn) {
			if (profileModalType === '?user-type=guest') {
				sessionStorage.setItem(
					'avatar_url',
					'/assets/male/readyDefaultMaleAvatar.glb',
				);
				sessionStorage.setItem('avatar_name', '손님');
				setNickname('손님');
				setProfileCanvas(
					new ProfileCanvas('/assets/male/readyDefaultMaleAvatar.glb'),
				);
				return;
			}

			try {
				const data = await findMyProfile();
				setNickname(data.nickname);
				setProfileCanvas(new ProfileCanvas(data.signedAvatarUrl));
			} catch (error) {
				if (error.response.status === 401) {
					alert('권한이 없습니다. 다시 로그인 해주세요.');
					close();
				} else if (error.response.status === 404) {
					if (
						confirm('생성된 프로필이 없습니다. 프로필 생성으로 이동합니다.')
					) {
						navigate('/avatar');
					} else {
						close();
					}
				} else {
					alert('알 수 없는 에러로 프로필 조회를 실패했습니다.');
					close();
				}
			}
		}
	};

	const changeProfileHandler = () => {
		navigate('/avatar?edit-mode');
	};

	const deleteProfileHandler = async () => {
		try {
			await deleteProfile();
			confirm('프로필을 성공적으로 삭제했습니다.');
			setNickname('');
			close();
		} catch (error) {
			if (error.response.status === 404) {
				alert('삭제할 프로필을 찾지 못했습니다.');
				close();
			} else if (error.response.status === 401) {
				alert('권한이 없습니다. 로그인을 다시 해주세요.');
				close();
			} else {
				alert('알 수 없는 에러가 발생했습니다.');
				close();
			}
		}
	};

	let overlayStyle;
	if (checkIsMobile() && window.innerWidth < window.innerHeight) {
		overlayStyle = {
			position: 'fixed',
			top: 0,
			left: '5%',
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0, 0, 0, 0)',
		};
	} else if (checkIsMobile() && window.innerWidth > window.innerHeight) {
		overlayStyle = {
			position: 'fixed',
			top: 20,
			left: '4%',
			right: 0,
			bottom: 30,
			backgroundColor: 'rgba(0, 0, 0, 0)',
		};
	} else {
		overlayStyle = {
			position: 'fixed',
			top: '10%',
			left: '35%',
			right: '35%',
			bottom: '10%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		};
	}

	return (
		<Modal
			isOpen={isModalOn}
			className={styles.profileModal}
			ariaHideApp={false}
			onAfterOpen={afterOpenModal}
			style={{
				overlay: overlayStyle,
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
							{isLoggedIn && (
								<>
									<ModalButton
										buttonName="아바타 변경"
										onClick={changeProfileHandler}
									/>
									<ModalButton
										buttonName="아바타 삭제"
										onClick={deleteProfileHandler}
									/>
								</>
							)}
							<ModalButton buttonName="닫기" onClick={close} />
						</td>
					</tr>
				</tbody>
			</table>
		</Modal>
	);
}

export default ProfileModal;

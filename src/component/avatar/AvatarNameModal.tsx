import axios from 'axios';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import AvatarCreateLoading from './AvatarCreateLoading';
import styles from './AvatarNameModal.module.css';

function AvatarNameModal(props) {
	Modal.setAppElement('#root');
	const [isNameModalOn, setIsNameModalOn] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [disable, setDisable] = useState(false);
	const [info, setInfo] = useState({
		name: '',
	});

	const navigate = useNavigate();

	const onChangeInfo = (e) => {
		setInfo({
			...info,
			[e.target.name]: e.target.value,
		});
	};

	const createAvatarHandler = async () => {
		const regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/;

		if (!regex.test(info.name)) {
			alert('한글, 영어, 숫자만 가능합니다. 아바타 이름을 다시 적어주세요');
			return;
		}

		setDisable(true);
		setIsLoading(true);
		await createProfile(props.avatarUrl, info.name);
		navigate('/?profile-complete=true');
	};

	const createProfile = async (avatarUrl: string, nickname: string) => {
		try {
			await axios.post('/api/v1/profiles', {
				nickname: nickname,
				publicType: 'private',
				avatarUrl: avatarUrl,
			});
		} catch (error) {
			if (error.response.status === 403) {
				alert('권한이 없습니다. 다시 로그인 해주세요.');
				navigate('/');
			} else {
				alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
				navigate('/');
			}
		}
	};

	const findProfile = async () => {
		try {
			const res = await axios.get('/api/v1/profiles/me');
			setInfo({ name: res.data.nickname });
		} catch (error) {
			if (error.response.status === 403) {
				alert('권한이 없습니다. 다시 로그인 해주세요.');
				navigate('/');
			} else if (error.response.status === 404) {
				alert('이미 생성된 프로필이 없습니다. 프로필을 먼저 생성해 주세요.');
				navigate('/');
			} else {
				alert('알 수 없는 에러로 아바타 수정을 실패했습니다.');
				navigate('/');
			}
		}
	};

	const updateProfile = async (avatarUrl: string, nickname: string) => {
		try {
			await axios.patch('/api/v1/profiles/me', {
				nickname: nickname,
				publicType: 'private',
				avatarUrl: avatarUrl,
			});
		} catch (error) {
			if (error.response.status === 403) {
				alert('권한이 없습니다. 다시 로그인 해주세요.');
				navigate('/');
			} else if (error.response.status === 404) {
				alert('프로필이 없습니다. 프로필을 먼저 생성 해주세요.');
			} else {
				alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
				navigate('/');
			}
		}
	};

	const patchAvatarHandler = async () => {
		const regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/;

		if (!regex.test(info.name)) {
			alert('한글, 영어, 숫자만 가능합니다. 아바타 이름을 다시 적어주세요');
			return;
		}

		setDisable(true);
		setIsLoading(true);
		await updateProfile(props.avatarUrl, info.name);
		navigate('/?profile-complete=true');
	};

	useEffect(() => {
		setIsNameModalOn(props.isNameModalOn);
	}, [props.isNameModalOn]);

	useEffect(() => {
		const qs = new URLSearchParams(location.search);
		if (qs.has('edit-mode')) {
			findProfile();
			setIsEditMode(true);
		}
	}, []);

	return (
		<>
			<Modal
				isOpen={isNameModalOn}
				className={styles.avatarNameModal}
				style={{
					overlay: {
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
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
				<table className={styles.avatarSetInfoTable}>
					<thead></thead>
					<tbody>
						<tr>
							<td>
								<h4>아바타 이름을 입력해주세요.</h4>
							</td>
						</tr>
						<tr>
							<td>
								<input
									disabled={disable}
									id="name"
									name="name"
									placeholder="홍길동"
									type="text"
									onChange={onChangeInfo}
									value={info.name}
								/>
							</td>
						</tr>
						<tr>
							<td>
								{isEditMode ? (
									<button
										disabled={disable}
										className={classNames([
											styles.enterRoom,
											styles.avatarSetInfoButton,
										])}
										onClick={patchAvatarHandler}
									>
										아바타 변경
									</button>
								) : (
									<button
										disabled={disable}
										className={classNames([
											styles.enterRoom,
											styles.avatarSetInfoButton,
										])}
										onClick={createAvatarHandler}
									>
										아바타 생성
									</button>
								)}

								<button
									disabled={disable}
									className={classNames([
										styles.close,
										styles.avatarSetInfoButton,
									])}
									onClick={props.close}
								>
									아바타 다시 선택
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</Modal>
			{isLoading && <AvatarCreateLoading />}
		</>
	);
}

export default AvatarNameModal;

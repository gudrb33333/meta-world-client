import classNames from 'classnames';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { createProfile, findMyProfile, updateProfile } from '../../api/profile';
import AvatarCreateLoading from '../AvatarCreateLoading';
import styles from './style.module.css';
import ModalButton from '../ModalButton';

function AvatarNameModal(props): JSX.Element {
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
		try {
			await createProfile({
				nickname: info.name,
				publicType: 'private',
				avatarUrl: props.avatarUrl,
			});
			navigate('/?profile-complete=true');
		} catch (error) {
			if (error.response.status === 401) {
				alert('권한이 없습니다. 다시 로그인 해주세요.');
				navigate('/');
			} else if (error.response.status === 409) {
				alert(
					'이미 프로필이 생성되어 있습니다. 변경을 원하실 경우 아바타 변경을 해주세요.',
				);
				navigate('/');
			} else {
				alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
				navigate('/');
			}
		}
	};

	const updateAvatarHandler = async () => {
		const regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/;

		if (!regex.test(info.name)) {
			alert('한글, 영어, 숫자만 가능합니다. 아바타 이름을 다시 적어주세요');
			return;
		}

		setDisable(true);
		setIsLoading(true);

		try {
			await updateProfile({
				nickname: info.name,
				publicType: 'private',
				avatarUrl: props.avatarUrl,
			});

			navigate('/?profile-complete=true');
		} catch (error) {
			if (error.response.status === 401) {
				alert('권한이 없습니다. 다시 로그인 해주세요.');
				navigate('/');
			} else if (error.response.status === 404) {
				alert('변경할 프로필이 없습니다. 프로필을 먼저 생성 해주세요.');
				navigate('/');
			} else {
				alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
				navigate('/');
			}
		}
	};

	useEffect(() => {
		setIsNameModalOn(props.isNameModalOn);
	}, [props.isNameModalOn]);

	useEffect(() => {
		(async function () {
			const qs = new URLSearchParams(location.search);
			if (qs.has('edit-mode')) {
				try {
					const data = await findMyProfile();
					setInfo({ name: data.nickname });
					setIsEditMode(true);
				} catch (error) {
					if (error.response.status === 401) {
						alert('권한이 없습니다. 다시 로그인 해주세요.');
						navigate('/');
					} else if (error.response.status === 404) {
						alert('변경할 프로필이 없습니다. 프로필을 먼저 생성해 주세요.');
						navigate('/');
					} else {
						alert('알 수 없는 에러로 프로필 조회를 실패했습니다.');
						navigate('/');
					}
				}
			}
		})();
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
									<ModalButton 
										buttonName='아바타 변경'
										disable={disable}
										onClick={updateAvatarHandler}
									/>
								) : (
									<ModalButton 
										buttonName='아바타 생성'
										disable={disable}
										onClick={createAvatarHandler}
									/>
								)}
								<ModalButton 
									buttonName='아바타 다시 선택'
									disable={disable}
									onClick={props.close}
								/>
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

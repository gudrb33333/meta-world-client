import classNames from 'classnames';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import styles from './AvatarNameModal.module.css';

function AvatarNameModal(props) {
	const [isNameModalOn, setIsNameModalOn] = useState(false);

	useEffect(() => {
		setIsNameModalOn(props.isNameModalOn);
	}, [props.isNameModalOn]);


	Modal.setAppElement('#root');
	const navigate = useNavigate();

	const [info, setInfo] = useState({
		name: '',
	});

	const onChangeInfo = (e) => {
		setInfo({
			...info,
			[e.target.name]: e.target.value,
		});
	};

	const enterRoom = () => {
		const regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/;

		if (!regex.test(info.name)) {
			alert('한글, 영어, 숫자만 가능합니다. 아바타 이름을 다시 적어주세요');
			return;
		}

		localStorage.setItem('avatar_name', info.name);
		navigate('/room');
	};

	return (
		<Modal
			isOpen={isNameModalOn}
			className={styles.avatarNameModal}
			style={{
				overlay: {
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(255, 255, 255, 0.1)",
				},
				content: {
					position: "absolute",
					background: "#80807f",
					overflow: "auto",
					WebkitOverflowScrolling: "touch",
					outline: "none",
					padding: "2px",
					fontFamily:  "Poppins, sans-serif",
					color: "#f3f0ef",
					borderRadius: "12px",
					backgroundColor: "#2a2d44",
					border: "1px solid #414361",
					textAlign: "center",
				},
			}}
		>
			<table className={styles.avatarSetInfoTable}>
				<thead>
  				</thead>
				<tbody>
					<tr>
						<td>
							<h4>아바타 이름을 입력해주세요.</h4>
						</td>
					</tr>
					<tr>
						<td>			
							<input
								id="name"
								name="name"
								placeholder="홍길동"
								type="text"
								onChange={onChangeInfo}
							/>
						</td>
					</tr>
					<tr>
						<td>
							<button className={classNames([styles.enterRoom, styles.avatarSetInfoButton])} onClick={enterRoom}>
								공간으로 입장
							</button>
							<button className={classNames([styles.close, styles.avatarSetInfoButton])} onClick={props.close}>
								아바타 다시 선택
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</Modal>
	);
}

export default AvatarNameModal;

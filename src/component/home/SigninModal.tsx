import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import classNames from 'classnames';
import styles from './SigninModal.module.css';
import { signin } from '../../api/auth';

function SigninModal(props) {
	const [isModalOn, setIsModalOn] = useState(false);

	const [signinEmail, setSigninEmail] = useState('');
	const [signinPassword, setSigninPassword] = useState('');

	const onSigninEmailHandler = (event) => {
		setSigninEmail(event.currentTarget.value);
	};

	const onSigninPasswordHandler = (event) => {
		setSigninPassword(event.currentTarget.value);
	};

	const onSigninSubmitHandler = async (event) => {
		event.preventDefault();

		try {
			await signin({
				email: signinEmail,
				password: signinPassword,
			});

			props.close();
			props.loginComplete();
			props.openProfileModal();
		} catch (error) {
			if (error.response.status === 403) {
				alert('아이디나 비밀번호가 없습니다.');
			} else {
				alert('알 수 없는 에러로 로그인을 실패했습니다.');
			}
		}
	};

	useEffect(() => {
		setIsModalOn(props.isModalOn);
	}, [props.isModalOn]);

	return (
		<Modal
			isOpen={isModalOn}
			className={styles.signinModal}
			ariaHideApp={false}
			style={{
				overlay: {
					position: 'fixed',
					top: 50,
					left: 0,
					right: 0,
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
			<form onSubmit={onSigninSubmitHandler}>
				<table className={styles.signinInfoTable}>
					<thead className={styles.signinThead}>로그인</thead>
					<tbody>
						<tr>
							<td>
								<h3 className={styles.signinText}>
									<div className={styles.title}>아이디</div>
									<input
										className={styles.signinInput}
										value={signinEmail}
										onChange={onSigninEmailHandler}
										type="email"
										id="signin-email"
										placeholder="Enter email"
									/>
								</h3>
							</td>
						</tr>
						<tr>
							<td>
								<h3 className={styles.signinText}>
									<div className={styles.title}>비밀번호</div>
									<input
										className={styles.signinInput}
										value={signinPassword}
										onChange={onSigninPasswordHandler}
										type="password"
										id="signin-password"
										placeholder="Password"
									/>
								</h3>
							</td>
						</tr>
						<tr>
							<td>
								<button
									className={classNames([
										styles.close,
										styles.signinInfoButton,
									])}
								>
									로그인
								</button>
								<button
									type="button"
									className={classNames([
										styles.close,
										styles.signinInfoButton,
									])}
									onClick={props.close}
								>
									닫기
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</form>
		</Modal>
	);
}

export default SigninModal;

import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import classNames from 'classnames';
import styles from './SignupModal.module.css';

function SignupModal(props) {
	const [isModalOn, setIsModalOn] = useState(false);

	const [signupEmail, setSignupEmail] = useState('');
	const [signupPassword, setSignupPassword] = useState('');
	const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

	const onSignupEmailHandler = (event) => {
		setSignupEmail(event.currentTarget.value);
	};

	const onSignupPasswordHandler = (event) => {
		setSignupPassword(event.currentTarget.value);
	};

	const onSignupConfirmPasswordHandler = (event) => {
		setSignupConfirmPassword(event.currentTarget.value);
	};

	const registerUser = async (dataToSubmit): Promise<void> => {
		await axios.post('/api/v1/auth/signup', dataToSubmit).then(
			() => {
				if (confirm('회원가입을 완료했습니다.')) {
					props.close();
					props.openSigninModal();
				}
			},
			(error) => {
				if (error.response.status === 409) {
					alert('회원가입을 실패했습니다. 이미 존재하는 아이디 입니다.');
				} else {
					alert('알 수 없는 에러로 회원가입을 실패했습니다.');
				}
				return Promise.reject(error);
			},
		);
	};

	const onSignupSubmitHandler = async (event) => {
		event.preventDefault();

		if (signupPassword !== signupConfirmPassword) {
			return alert('비밀번호와 비밀번호 확인이 같지 않습니다.');
		}

		const body = {
			email: signupEmail,
			password: signupPassword,
			confirmPassword: signupConfirmPassword,
		};

		await registerUser(body);
	};

	useEffect(() => {
		setIsModalOn(props.isModalOn);
	}, [props.isModalOn]);

	return (
		<Modal
			isOpen={isModalOn}
			className={styles.signupModal}
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
			<form onSubmit={onSignupSubmitHandler}>
				<table className={styles.signupInfoTable}>
					<thead className={styles.signupThead}>회원가입</thead>
					<tbody>
						<tr>
							<td>
								<h3 className={styles.signupText}>
									<div className={styles.title}>아이디</div>
									<input
										className={styles.signupInput}
										value={signupEmail}
										onChange={onSignupEmailHandler}
										type="email"
										id="signup-email"
										placeholder="Enter email"
									/>
								</h3>
							</td>
						</tr>
						<tr>
							<td>
								<h3 className={styles.signupText}>
									<div className={styles.title}>비밀번호</div>
									<input
										className={styles.signupInput}
										value={signupPassword}
										onChange={onSignupPasswordHandler}
										type="password"
										id="signup-password"
										placeholder="Password"
									/>
								</h3>
							</td>
						</tr>
						<tr>
							<td>
								<h3 className={styles.signupText}>
									<div className={styles.title}>비밀번호 확인</div>
									<input
										className={styles.signupInput}
										value={signupConfirmPassword}
										onChange={onSignupConfirmPasswordHandler}
										type="password"
										id="signup-confirm-password"
										placeholder="Password Confirm"
									/>
								</h3>
							</td>
						</tr>
						<tr>
							<td>
								<button
									className={classNames([
										styles.close,
										styles.signupInfoButton,
									])}
								>
									회원가입
								</button>
								<button
									type="button"
									className={classNames([
										styles.close,
										styles.signupInfoButton,
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

export default SignupModal;

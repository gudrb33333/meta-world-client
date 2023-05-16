import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import classNames from 'classnames';
import styles from './style.module.css';
import { signin } from '../../api/auth';
import checkIsMobile from '../../utils/isMobile';

function SigninModal(props) {
	const apiUrl = process.env.VITE_API_URL;
	const googleAuthorizationUrl = `${apiUrl}/oauth2/authorization/google`;
	const kakaoAuthorizationUrl = `${apiUrl}/oauth2/authorization/kakao`;
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
			if (error.response.status === 401) {
				alert('아이디나 비밀번호가 없습니다.');
			} else {
				alert('알 수 없는 에러로 로그인을 실패했습니다.');
			}
		}
	};

	useEffect(() => {
		setIsModalOn(props.isModalOn);
	}, [props.isModalOn]);



	let overlayStyle;
	if (checkIsMobile() && window.innerWidth < window.innerHeight) {
		overlayStyle =	{
			position: 'fixed',
			top: '20%',
			left: 0,
			right: 0,
			bottom: '30%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		}
	} else if (checkIsMobile() && window.innerWidth > window.innerHeight) {
		overlayStyle =	{
			position: 'fixed',
			top: '10%',
			left: '10%',
			right: '10%',
			bottom: '10%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		}
	} else {
		overlayStyle =	{
			position: 'fixed',
			top: '30%',
			left: '30%',
			right: '30%',
			bottom: '20%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		}
	}

	return (
		<Modal
			isOpen={isModalOn}
			className={styles.signinModal}
			ariaHideApp={false}
			style={{
				overlay: overlayStyle,
				content: {
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
								<a href={googleAuthorizationUrl}>
  									<img className={styles.signinImg} src="/assets/images/btn_login_google.png" />
								</a>
							</td>
						</tr>
						<tr>	
							<td>
								<a href={kakaoAuthorizationUrl}>
									<img className={styles.signinImg} src='/assets/images/btn_login_kakao.png'></img>
								</a>
							</td>	
						</tr>
						<tr>
							<td>							
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

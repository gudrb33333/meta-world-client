import Modal from 'react-modal';
import styles from './style.module.css';
import checkIsMobile from '../../utils/isMobile';
import ModalButton from '../Buttons/ModalButton';

interface SigninModalProps {
	isModalOn: boolean;
	close: () => void;
	loginComplete: () => void;
  }

function SigninModal({ isModalOn, close, loginComplete }: SigninModalProps): JSX.Element {
	const apiUrl = process.env.VITE_API_URL;
	const googleAuthorizationUrl: string = `${apiUrl}/oauth2/authorization/google`;
	const kakaoAuthorizationUrl: string = `${apiUrl}/oauth2/authorization/kakao`;

	let overlayStyle;
	if (checkIsMobile() && window.innerWidth < window.innerHeight) {
		overlayStyle = {
			position: 'fixed',
			top: '20%',
			left: 0,
			right: 0,
			bottom: '30%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		};
	} else if (checkIsMobile() && window.innerWidth > window.innerHeight) {
		overlayStyle = {
			position: 'fixed',
			top: '10%',
			left: '10%',
			right: '10%',
			bottom: '10%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		};
	} else {
		overlayStyle = {
			position: 'fixed',
			top: '30%',
			left: '30%',
			right: '30%',
			bottom: '20%',
			backgroundColor: 'rgba(0, 0, 0, 0)',
		};
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
			<form>
				<table className={styles.signinInfoTable}>
					<thead className={styles.signinThead}>로그인</thead>
					<tbody>
						<tr>
							<td>
								<a href={googleAuthorizationUrl}>
									<img
										className={styles.signinImg}
										src="/assets/images/btn_login_google.png"
									/>
								</a>
							</td>
						</tr>
						<tr>
							<td>
								<a href={kakaoAuthorizationUrl}>
									<img
										className={styles.signinImg}
										src="/assets/images/btn_login_kakao.png"
									></img>
								</a>
							</td>
						</tr>
						<tr>
							<td>
								<ModalButton 
									buttonName='닫기'
									onClick={close}
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</form>
		</Modal>
	);
}

export default SigninModal;

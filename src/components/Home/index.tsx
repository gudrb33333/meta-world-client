import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames';
import styles from './style.module.css';
import SigninModal from '../SigninModal';
import { useEffect, useState } from 'react';
import { logout } from '../../api/auth';
import PushableButton from '../PushableButton';

function Home() {
	const movePage = useNavigate();

	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isSigninModalOn, setIsSigninModalOn] = useState(false);
	const [isSignupModalOn, setIsSignupModalOn] = useState(false);

	const openSigninModal = () => {
		setIsSigninModalOn(true);
	};

	const closeSigninModal = () => {
		setIsSigninModalOn(false);
	};

	const loginComplete = () => {
		setIsLoggedIn(true);
		movePage('/lobby');
	};

	useEffect(() => {
		axios.get('/api/v1/members/me').then(
			() => {
				setIsLoggedIn(true);
				movePage('/lobby');
			},
			() => {
				setIsLoggedIn(false);
			},
		);
	}, []);

	return (
		<div className={classNames([styles.home, styles.fadeIn])}>
			<div className={styles.homeScreen}>
				<div
					className={classNames([styles.homeTitle, styles.textFlickerInGlow])}
				>
					Meta World
				</div>
				<div className={styles.homeButtonContainer}>
					<PushableButton
						content="소셜 로그인"
						slideDirection="slideInLeft"
						onClick={openSigninModal}
					/>
				</div>
				<div className={styles.homeButtonContainer}>
					<Link to="/lobby?user-type=guest">
						<PushableButton
							content="로그인 없이 입장"
							slideDirection="slideInRight"
							onClick={null}
						/>
					</Link>
					<SigninModal
						isModalOn={isSigninModalOn}
						close={closeSigninModal}
						loginComplete={loginComplete}
						// openProfileModal={openProfileModal}
					/>
				</div>
			</div>
		</div>
	);
}

export default Home;

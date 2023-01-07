import { Link } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames';
import styles from './Home.module.css';
import SignupModal from './SignupModal';
import SigninModal from './SigninModal';
import ProfileModal from './ProfileModal';
import { useEffect, useState } from 'react';
import { logout } from '../../api/auth'

function Home() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isSigninModalOn, setIsSigninModalOn] = useState(false);
	const [isSignupModalOn, setIsSignupModalOn] = useState(false);
	const [isProfileModalOn, setIsProfileModalOn] = useState(false);

	const openSigninModal = () => {
		setIsSigninModalOn(true);
	};

	const closeSigninModal = () => {
		setIsSigninModalOn(false);
	};

	const openSignupModal = () => {
		setIsSignupModalOn(true);
	};

	const closeSignupModal = () => {
		setIsSignupModalOn(false);
	};

	const openProfileModal = () => {
		setIsProfileModalOn(true);
	};

	const closeProfileModal = () => {
		setIsProfileModalOn(false);
	};

	const loginComplete = () => {
		setIsLoggedIn(true);
	};

	const logoutHandler = async () => {
		try {
			await logout();
			setIsLoggedIn(false);
		} catch (error) {
			if (error.response.status == 403) {
				alert('이미 로그아웃 되었습니다.');
				setIsLoggedIn(false);
			}
		}
	};

	useEffect(() => {
		axios.get('/api/v1/members/me').then(
			() => {
				setIsLoggedIn(true);
			},
			() => {
				setIsLoggedIn(false);
			},
		);
	}, []);

	useEffect(() => {
		const qs = new URLSearchParams(location.search);
		if (qs.get('profile-complete') === 'true') {
			openProfileModal();
		}
	}, []);

	if (isLoggedIn) {
		return (
			<div className={classNames([styles.home, styles.fadeIn])}>
				<div className={styles.homeScreen}>
					<div
						className={classNames([styles.homeTitle, styles.textFlickerInGlow])}
					>
						Meta World
					</div>
					<div className={styles.homeButtonContainer}>
						<button
							className={classNames([
								styles.homeRedBlockButton,
								styles.pushable,
								styles.slideInLeft,
							])}
							onClick={logoutHandler}
						>
							<span className={styles.shadow}></span>
							<span className={styles.edge}></span>
							<span className={styles.front}>로그아웃</span>
						</button>
						<button
							className={classNames([
								styles.homeRedBlockButton,
								styles.pushable,
								styles.slideInLeft,
							])}
							onClick={openProfileModal}
						>
							<span className={styles.shadow}></span>
							<span className={styles.edge}></span>
							<span className={styles.front}>프로필</span>
						</button>
					</div>
					<div className={styles.homeButtonContainer}>
						<Link to="/room?user-type=guest">
							<button
								className={classNames([styles.pushable, styles.slideInRight])}
							>
								<span className={styles.shadow}></span>
								<span className={styles.edge}></span>
								<span className={styles.front}>기본 캐릭터로 입장</span>
							</button>
						</Link>
						<ProfileModal
							isModalOn={isProfileModalOn}
							close={closeProfileModal}
						/>
					</div>
				</div>
			</div>
		);
	} else {
		return (
			<div className={classNames([styles.home, styles.fadeIn])}>
				<div className={styles.homeScreen}>
					<div
						className={classNames([styles.homeTitle, styles.textFlickerInGlow])}
					>
						Meta World
					</div>
					<div className={styles.homeButtonContainer}>
						<button
							className={classNames([
								styles.homeRedBlockButton,
								styles.pushable,
								styles.slideInLeft,
							])}
							onClick={openSigninModal}
						>
							<span className={styles.shadow}></span>
							<span className={styles.edge}></span>
							<span className={styles.front}>로그인</span>
						</button>
						<button
							className={classNames([
								styles.homeRedBlockButton,
								styles.pushable,
								styles.slideInLeft,
							])}
							onClick={openSignupModal}
						>
							<span className={styles.shadow}></span>
							<span className={styles.edge}></span>
							<span className={styles.front}>회원가입</span>
						</button>
					</div>
					<div className={styles.homeButtonContainer}>
						<Link to="/room?user-type=guest">
							<button
								className={classNames([
									styles.homeRedBlockButton,
									styles.pushable,
									styles.slideInRight,
								])}
							>
								<span className={styles.shadow}></span>
								<span className={styles.edge}></span>
								<span className={styles.front}>기본 캐릭터로 입장</span>
							</button>
						</Link>
						<SigninModal
							isModalOn={isSigninModalOn}
							close={closeSigninModal}
							loginComplete={loginComplete}
							openProfileModal={openProfileModal}
						/>
						<SignupModal
							isModalOn={isSignupModalOn}
							close={closeSignupModal}
							openSigninModal={openSigninModal}
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default Home;

import { Link } from 'react-router-dom';
import classNames from 'classnames';
import styles from './Home.module.css';

function Home() {
	return (
		<div className={classNames([styles.home, styles.fadeIn])}>
			<div className={styles.homeScreen}>
				<div
					className={classNames([styles.homeTitle, styles.textFlickerInGlow])}
				>
					Meta World
				</div>
				<div className={styles.homeButtonContainer}>
					<Link to='/avatar'>
						<button
							className={classNames([
								styles.homeCreateAvatarButton,
								styles.pushable,
								styles.slideInLeft,
							])}
						>
							<span className={styles.shadow}></span>
							<span className={styles.edge}></span>
							<span className={styles.front}>아바타 만들기</span>
						</button>
					</Link>
					<Link to='/room?user-type=guest'>
						<button
							className={classNames([styles.pushable, styles.slideInRight])}
						>
							<span className={styles.shadow}></span>
							<span className={styles.edge}></span>
							<span className={styles.front}>기본 캐릭터로 입장</span>
						</button>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default Home;

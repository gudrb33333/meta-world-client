import styles from './LoadingScreen.module.css';
import { useEffect, useState } from 'react';
import classNames from 'classnames';

function LoadingScreen(props) {
	const [isLoading, setIsLoading] = useState(props.isLoading);

	useEffect(() => {
		setIsLoading(props.isLoading);
	}, [props.isLoading]);

	return (
		<div
			id={styles.loadingScreen}
			className={styles.kenburnsBottom}
			style={{ display: isLoading ? 'flex' : 'none' }}
		>
			<div className={styles.loadingScreenBackground}></div>
			<div className={styles.kenburnsBottom}></div>
			<div className={classNames([styles.loadingTitle, styles.textPopUpTop])}>
				Meta World
			</div>

			<div
				className={classNames([styles.loadingText, styles.trackingInContract])}
			>
				Loading...
			</div>
		</div>
	);
}

export default LoadingScreen;

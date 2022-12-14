import styles from './LoadingScreen.module.css';
import { useEffect, useState } from 'react';
import classNames from 'classnames';

function LoadingScreen(props) {
	const [isLoading, setIsLoading] = useState(props.isLoading);
	const [doneLoading, setDoneLoading] = useState(0);

	useEffect(() => {
		setIsLoading(props.isLoading);
	}, [props.isLoading]);

	useEffect(() => {
		const doneLoadingStatusCallback = (e: CustomEvent) => {
			setDoneLoading(e.detail.doneLoading);
		};

		document.addEventListener('done-loading-status', doneLoadingStatusCallback);

		return () => {
			document.removeEventListener(
				'done-loading-status',
				doneLoadingStatusCallback,
			);
		};
	});

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
			<div>
				<p>{doneLoading}%</p>
			</div>
		</div>
	);
}

export default LoadingScreen;

import classNames from 'classnames';
import { useEffect, useState } from 'react';
import styles from './UiContainer.module.css';
import checkIsMobile from '../../utils/isMobile'

function UiContainer(props) {
	const [isLoading, setIsLoading] = useState(props.isLoading);
	const [isUiContainerOn, setIsUiContainerOn] = useState(props.isUiContainerOn);

	useEffect(() => {
		setIsLoading(props.isLoading);
		setIsUiContainerOn(props.isUiContainerOn);
	}, [props.isLoading, props.isUiContainerOn]);

	return (
		<div
			id={styles.uiContainer}
			style={{ display: !checkIsMobile() && !isLoading && isUiContainerOn ? 'block' : 'none' }}
		>
			<div className={styles.leftPanel}>
				<div
					id='controls'
					className={classNames([styles.panelSegment, styles.flexBottom])}
				></div>
				<h2 className={styles.controlsTitle}>Controls</h2>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>W</span>
					<span className={styles.ctrlKey}>A</span>
					<span className={styles.ctrlKey}>S</span>
					<span className={styles.ctrlKey}>D</span>
					<span className={styles.ctrlDesc}>방향키</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>Shift</span>
					<span className={styles.ctrlDesc}>달리기</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>Space</span>
					<span className={styles.ctrlDesc}>점프</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>G</span>
					<span className={styles.ctrlKey}>F</span>
					<span className={styles.ctrlDesc}>의자 앉기/일어나기</span>
				</div>
			</div>
		</div>
	);
}

export default UiContainer;

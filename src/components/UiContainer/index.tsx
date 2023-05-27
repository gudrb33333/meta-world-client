import classNames from 'classnames';
import styles from './style.module.css';
import checkIsMobile from '../../utils/isMobile';

interface UiContainerProps {
	isLoading: boolean;
	isUiContainerOn: boolean;
}

function UiContainer({ isLoading, isUiContainerOn}: UiContainerProps) {
	return (
		<div
			id={styles.uiContainer}
			style={{
				display:
					!checkIsMobile() && !isLoading && isUiContainerOn ? 'block' : 'none',
			}}
		>
			<div className={styles.leftPanel}>
				<div
					id="controls"
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
					<span className={styles.ctrlKey}>F</span>
					<span className={styles.ctrlDesc}>상호작용</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>1</span>
					<span className={styles.ctrlDesc}>박수</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>2</span>
					<span className={styles.ctrlDesc}>손 흔들기</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>3</span>
					<span className={styles.ctrlDesc}>춤 추기</span>
				</div>
				<div className={styles.ctrlRow}>
					<span className={styles.ctrlKey}>`</span>
					<span className={styles.ctrlDesc}>소셜 취소</span>
				</div>
			</div>
		</div>
	);
}

export default UiContainer;

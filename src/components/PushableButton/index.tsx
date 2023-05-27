import classNames from 'classnames';
import styles from './style.module.css';

interface PushableButtonProps {
	slideDirection: string;
	content: string;
	onClick: () => void;
}

function PushableButton({ slideDirection, content, onClick }: PushableButtonProps): JSX.Element {
	return (
		<button
			className={classNames([
				styles.RedBlockButton,
				styles.pushable,
				styles[slideDirection],
			])}
			onClick={onClick}
		>
			<span className={styles.shadow}></span>
			<span className={styles.edge}></span>
			<span className={styles.front}>{content}</span>
		</button>
	);
}

export default PushableButton;

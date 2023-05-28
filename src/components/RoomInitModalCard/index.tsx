import styles from './style.module.css';

interface CardProps {
	title: string;
	imageUrl: string;
	body: string;
	roomUrl: string;
}

function Card({ title, imageUrl, body, roomUrl }: CardProps): JSX.Element {
	return (
		<div className={styles.cardContainer}>
			<div className={styles.imageContainer}>
				<img src={imageUrl} alt="" />
			</div>
			<div className={styles.cardContent}>
				<div className={styles.cardTitleBar}></div>
				<div className={styles.cardTitle}>
					<h3>{title}</h3>
				</div>
				<div className={styles.cardBody}>
					<p>{body}</p>
				</div>
			</div>
			<div className={styles.btn}>
				<button>
					<a href={roomUrl}>공간으로 입장</a>
				</button>
			</div>
		</div>
	);
}

export default Card;

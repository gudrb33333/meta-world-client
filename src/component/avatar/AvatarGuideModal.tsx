import classNames from 'classnames';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import styles from './AvatarGuideModal.module.css';

function AvatarGuideModal(props) {
    const [isGuideModalOn, setIsGuideModalOn] = useState(true);

    useEffect(() => {
		setIsGuideModalOn(props.isGuideModalOn);
	}, [props.isGuideModalOn]);

    return (
        <Modal
        isOpen={isGuideModalOn}
        className={styles.avatarGuideModal}
        style={{
            overlay: {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
            content: {
                position: "absolute",
                background: "#80807f",
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
                outline: "none",
                padding: "2px",
                fontFamily:  "Poppins, sans-serif",
                color: "#f3f0ef",
                borderRadius: "12px",
                backgroundColor: "#2a2d44",
                border: "1px solid #414361",
                textAlign: "center",
            },
        }}
    >
		<table className={styles.avatarGuideInfoTable}>
			<thead>						
			</thead>
			<tbody>
                <tr>
				    <td>
					    <h2>알려드립니다!</h2>
				    </td>
			    </tr>
				<tr>
					<td>
						<h3 className={styles.avatarGuideText}>1. Full-body 선택 / Half-body (지원 X)</h3>
					</td>
				</tr>
                <tr>
					<td>
						<h3 className={styles.avatarGuideText}>2. Masculine - 남성 / Feminine - 여성</h3>
					</td>
				</tr>
                <tr>
						<td>
							<button className={classNames([styles.close, styles.avatarGuideInfoButton])} onClick={props.close}>
								닫기
							</button>
                        </td>
                </tr>
			</tbody>
		</table>	
    </Modal>
    );
}

export default AvatarGuideModal;

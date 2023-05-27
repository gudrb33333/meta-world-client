import classNames from 'classnames';
import styles from './style.module.css';

interface ModalButtonProp {
    buttonName: string;
    onClick: () => void;
}

function ModalButton({buttonName, onClick}: ModalButtonProp): JSX.Element   {

    return (
        <button
            type="button"
            className={classNames([
                styles.modalButton,
            ])}
            onClick={onClick}
        >
            {buttonName}
        </button>
    );
}

export default ModalButton;

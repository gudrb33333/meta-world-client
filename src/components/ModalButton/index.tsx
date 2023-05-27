import classNames from 'classnames';
import styles from './style.module.css';

interface ModalButtonProp {
    buttonName: string;
    disable?: boolean;
    onClick: () => void;
}

function ModalButton({ buttonName, disable = false, onClick }: ModalButtonProp): JSX.Element   {

    return (
        <button
            disabled={disable}
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

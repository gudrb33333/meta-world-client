import { useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

function AvatarNameModal(props) {
  Modal.setAppElement('#root')

  const navigate = useNavigate();
  const{ isOpenModal, close } = props

  const [info, setInfo] = useState({
    name: "",
  });

  const onChangeInfo= (e) => {
    setInfo({
      ...info,
      [e.target.name]: e.target.value,
    });
  };

  const enterRoom = () => {
    const regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/;

    if(!regex.test(info.name)){
      alert('한글, 영어, 숫자만 가능합니다. 아바타 이름을 다시 적어주세요')
      return
    }

    localStorage.setItem('name', info.name)
    navigate("/room")
  }

  return (
    <Modal 
      isOpen={isOpenModal} 
      className="avatar-name-modal"
      style={{
        overlay: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        },
        content: {
          position: 'absolute',
          top: '38%',
          left: '25%',
          right: '25%',
          bottom: '38%',
          border: '1px solid #ccc',
          background: '#80807f',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '4px',
          outline: 'none',
          padding: '20px'
        }
      }}
    >
        아바타 이름을 입력해주세요.
        <input 
          id="name" 
          name='name' 
          placeholder='홍길동' 
          type='text'
          onChange={onChangeInfo}
        />
        <button className="enter-room" onClick={enterRoom}>
            공간으로 입장
        </button>
        <button className="close" onClick={close}>
            아바타 다시 선택
        </button>
    </Modal>
  );
}
  
export default AvatarNameModal;
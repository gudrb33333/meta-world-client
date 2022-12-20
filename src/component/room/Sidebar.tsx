import React, {useEffect, useRef, useState } from "react";
import styles from "./Sidebar.module.css";


function Sidebar({ width=window.innerWidth/2, children }) {
  const [isOpen, setOpen] = useState(false);
  const [xPosition, setX] = useState(-width);
  const side = useRef<any>();
  
  // button 클릭 시 토글
  const toggleMenu = () => {
    if (xPosition < 0) {
      setX(0);
      setOpen(true);
    } else {
      setX(-width);
      setOpen(false);
    }
  };
  
  // 사이드바 외부 클릭시 닫히는 함수
  const handleClose = async e => {
    let sideArea = side.current;
    let sideCildren = side.current.contains(e.target);
    if (isOpen && (!sideArea || !sideCildren)) {
      await setX(-width); 
      await setOpen(false);
    }
  }

  useEffect(()=> {
    window.addEventListener('click', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
    };
  })

  useEffect(() => {
    const toggleOpenEventCallBack = () => {
        setX(0);
        setOpen(true);
		};

    const toggleCloseEventCallBack = () => {
        setX(-width);
        setOpen(false);
		};

    document.addEventListener('sidebar-toggle-open-event', toggleOpenEventCallBack);
    document.addEventListener('sidebar-toggle-close-event', toggleCloseEventCallBack);

		return () => {
			document.removeEventListener('sidebar-toggle-open-event', toggleOpenEventCallBack);
      document.removeEventListener('sidebar-toggle-close-event', toggleCloseEventCallBack);
		};
	}, [isOpen]);


  return (
    <div className={styles.container}>
      <div ref={side}  className={styles.sidebar} style={{ width: `${width}px`, height: '100%',  transform: `translatex(${-xPosition}px)`}}>
          <button onClick={() => toggleMenu()}
          className={styles.button} >
            <span>X</span>
          </button>
        <div id="clothing-container" className={styles.content}>
        </div>
        <ul>
          <li>asdasdasd</li>
          <li>asdasdasd</li>
          <li>asdasdasd</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
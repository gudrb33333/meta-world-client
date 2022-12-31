import React, { useEffect, useRef, useState } from 'react';
import styles from './Sidebar.module.css';
import axios from 'axios';

function Sidebar(props) {
	const width = window.innerWidth / 2;
	const [isOpen, setOpen] = useState(false);
	const [xPosition, setX] = useState(-width);
	const side = useRef<any>();

	// button 클릭 시 토글
	const toggleMenu = async () => {
		if (xPosition < 0) {
			setX(0);
			setOpen(true);
		} else {
			const world = props.getWorld();
			world.userAvatar.avatarState.sidebarClose();
			setX(-width);
			setOpen(false);

			await axios
				.delete('/api/v1/auth/logout', {
					withCredentials: true,
				})
				.then(
					(res) => {
						console.log('logout Complete');
						console.log(res);
					},
					(error) => {
						console.error('ERROR::logout');
						console.error(error);
					},
				);

			await axios
				.delete('/api/v1/auth/logout', {
					withCredentials: true,
				})
				.then(
					(res) => {
						console.log('logout Complete');
						console.log(res);
					},
					(error) => {
						console.error('ERROR::logout');
						console.error(error);
					},
				);
		}
	};

	// 사이드바 외부 클릭시 닫히는 함수
	// const handleClose = async e => {
	//   let sideArea = side.current;
	//   let sideCildren = side.current.contains(e.target);
	//   if (isOpen && (!sideArea || !sideCildren)) {
	//     await setX(-width);
	//     await setOpen(false);
	//   }
	// }

	// useEffect(()=> {
	//   window.addEventListener('click', handleClose);
	//   return () => {
	//     window.removeEventListener('click', handleClose);
	//   };
	// })

	useEffect(() => {
		const toggleOpenEventCallBack = async () => {
			setX(0);
			setOpen(true);
		};

		const toggleCloseEventCallBack = () => {
			setX(-width);
			setOpen(false);
		};

		document.addEventListener(
			'sidebar-toggle-open-event',
			toggleOpenEventCallBack,
		);
		document.addEventListener(
			'sidebar-toggle-close-event',
			toggleCloseEventCallBack,
		);

		return () => {
			document.removeEventListener(
				'sidebar-toggle-open-event',
				toggleOpenEventCallBack,
			);
			document.removeEventListener(
				'sidebar-toggle-close-event',
				toggleCloseEventCallBack,
			);
		};
	}, [isOpen]);

	return (
		<div className={styles.container}>
			<div
				ref={side}
				className={styles.sidebar}
				style={{
					width: `${width}px`,
					height: '100%',
					transform: `translatex(${-xPosition}px)`,
				}}
			>
				<button onClick={() => toggleMenu()} className={styles.button}>
					<span>X</span>
				</button>
				<div id="clothing-container" className={styles.content}></div>
				<ul>
					<li>asdasdasd</li>
					<li>asdasdasd</li>
					<li>asdasdasd</li>
				</ul>
			</div>
		</div>
	);
}

export default Sidebar;

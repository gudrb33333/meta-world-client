import React, { useEffect, useRef, useState } from 'react';
import styles from './Sidebar.module.css';
import axios from 'axios';
import { findClothing } from '../../api/clothing';

function Sidebar(props) {
	const width = window.innerWidth / 2.5;
	const [permission, setPermission] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isOpen, setOpen] = useState(false);
	const [xPosition, setX] = useState(-width);
	const [clothingName, setClothingName] = useState(null);
	const [clothingBrand, setClothingBrand] = useState(null);
	const [clothingSerialNumber, setClothingSerialNumber] = useState(null);
	const [clothingGenderType, setClothingGenderType] = useState(null);
	const [clothingPrice, setClothingPrice] = useState(null);
	const [clothingAssociateLink, setClothingAssociateLink] = useState(null);
	const [clothingDetailDescription, setClothingDetailDescription] =
		useState(null);
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
		const toggleOpenEventCallBack = async (e) => {
			setX(0);
			setOpen(true);
			const sidebarCanvas = e.detail.sidebarCanvas;
			try {
				const data = await findClothing({ uuid: e.detail.name });
				setPermission(true);
				const commaPrice = data.price
					.toString()
					.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
				sidebarCanvas.loadClothing(data.signedClothingUrl);
				setClothingName(data.name);
				setClothingBrand(data.brand);
				setClothingSerialNumber(data.serialNumber);
				setClothingPrice(commaPrice);
				setClothingAssociateLink(data.associateLink);
				setClothingDetailDescription(data.detailDescription);

				if (data.genderType === 'male') {
					setClothingGenderType('남');
				} else if (data.genderType === 'female') {
					setClothingGenderType('여');
				} else {
					setClothingGenderType('남/여');
				}
			} catch (error) {
				setPermission(false);
				sidebarCanvas.loadClothing('/assets/can_not_access_text.glb');
				if (error.response.status === 404) {
					setErrorMessage('의상 정보가 없습니다.');
				} else if (error.response.status === 403) {
					setErrorMessage('자산에 접근할 권한이 없습니다. 로그인 해주세요.');
				} else {
					setErrorMessage('알 수 없는 에러가 발생했습니다.');
				}
			}
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

	if (permission) {
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
						<span>닫기</span>
					</button>
					<div
						id="clothing-container"
						className={styles.threeDimensionalContent}
					></div>
					<div className={styles.productInfo}>
						<header className={styles.productHeader}>{clothingName}</header>
						<table className={styles.productTable}>
							<th colSpan={2} className={styles.productThead}>
								Product Info - 제품정보
							</th>
							<tbody>
								<tr>
									<td className={styles.productTdTitle}>브랜드 / 품번</td>
									<td className={styles.productTdInfo}>
										{clothingBrand} / {clothingSerialNumber}
									</td>
								</tr>
								<tr>
									<td className={styles.productTdTitle}>성별</td>
									<td className={styles.productTdInfo}>{clothingGenderType}</td>
								</tr>
								<tr>
									<td className={styles.productTdTitle}>가격</td>
									<td className={styles.productTdInfo}>{clothingPrice}원</td>
								</tr>
								<tr>
									<td colSpan={2} className={styles.productTdLink}>
										<a
											className={styles.productALink}
											href={clothingAssociateLink}
											target="_blank"
										>
											옷 보러가기
										</a>
									</td>
								</tr>
								<tr>
									<td colSpan={2} className={styles.productTdInfo}>
										&nbsp;{clothingDetailDescription}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	} else {
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
						<span>닫기</span>
					</button>
					<div
						id="clothing-container"
						className={styles.threeDimensionalContent}
					></div>
					<div className={styles.productInfo}>
						<header className={styles.productHeader}>{clothingName}</header>
						<table className={styles.productTable}>
							<th colSpan={2} className={styles.productThead}>
								Product Info - 제품정보
							</th>
							<tbody>
								<tr>
									<td colSpan={2} className={styles.productTdInfo}>
										&nbsp; {errorMessage}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	}
}

export default Sidebar;

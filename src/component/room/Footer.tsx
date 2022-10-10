import { useEffect, useState } from 'react';
import checkIsMobile from '../../utils/isMobile';
import styles from './Footer.module.css';

function Footer(props) {
	const [isLoading, setIsLoading] = useState(true);
	const [isMicOn, setIsMicOn] = useState(false);
	const [isWebcamOn, setIsWebcamOn] = useState(false);
	const [isShareOn, setIsShareOn] = useState(false);
	const [isUiContainerOn, setIsUiContainerOn] = useState(false);

	useEffect(() => {
		setIsLoading(props.isLoading);
		setIsUiContainerOn(props.isUiContainerOn);
	}, [props.isLoading, props.isUiContainerOn]);

	useEffect(() => {
		const initMicEventCallBack = () => {
			setIsMicOn(true);
		};

		const stopShareEventCallBack = () => {
			shareButtonClicked();
		};

		document.addEventListener('init-mic-event', initMicEventCallBack);
		document.addEventListener('stop-share-event', stopShareEventCallBack);

		return () => {
			document.removeEventListener('init-mic-event', initMicEventCallBack);
			document.removeEventListener('stop-share-event', stopShareEventCallBack);
		};
	}, [props.getWorld, isShareOn]);

	const micButtonClicked = () => {
		const world = props.getWorld();
		const mediasoupAdapter = world.mediasoupAdapter;
		if (isMicOn) {
			mediasoupAdapter.muteMic();
			setIsMicOn(false);
		} else {
			mediasoupAdapter.unmuteMic();
			setIsMicOn(true);
		}
	};

	const webcamButtonClicked = () => {
		const world = props.getWorld();
		const mediasoupAdapter = world.mediasoupAdapter;
		if (isWebcamOn) {
			mediasoupAdapter.disableWebcam();
			setIsWebcamOn(false);
		} else {
			mediasoupAdapter.enableWebcam();
			setIsWebcamOn(true);
		}
	};

	const shareButtonClicked = async () => {
		const world = props.getWorld();
		const mediasoupAdapter = world.mediasoupAdapter;

		if (isShareOn) {
			try {
				await mediasoupAdapter.disableShare();
				setIsShareOn(false);
			} catch (e: any){
				setIsShareOn(true);
			}
		} else {
			try {
				await mediasoupAdapter.enableShare();
				setIsShareOn(true);
			} catch (e: any){
				setIsShareOn(false);
			}
		}
	};

	const controlsButtonClicked = async () => {
		if (isUiContainerOn) {
			props.setUiContainerOn(false);
		} else {
			props.setUiContainerOn(true);
		}
	};

	return (
		<footer style={{ display: isLoading ? 'none' : 'block' }}>
			<div className={styles.footerButton}>
				<ul>
					<li>
						<a
							id={styles.buttonMic}
							onClick={micButtonClicked}
							className={isMicOn ? styles.activeOn : styles.activeOff}
						>
							<svg
								className="glow"
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="745.000000pt"
								viewBox="0 0 512.000000 745.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,745.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M2382 7439 c-538 -73 -987 -448 -1151 -962 -68 -212 -64 -135 -68
			    	        -1497 -3 -839 -1 -1275 7 -1361 54 -634 493 -1129 1120 -1265 121 -27 419 -27
			    	        540 0 292 63 526 192 729 401 232 239 362 525 391 864 8 86 10 522 7 1361 -3
			    	        1105 -5 1244 -20 1317 -40 196 -123 396 -229 551 -72 106 -263 295 -368 363
			    	        -160 106 -316 171 -498 209 -114 24 -350 34 -460 19z"
									/>
									<path
										d="M185 4651 c-78 -20 -156 -90 -174 -158 -14 -50 -14 -729 -1 -883 48
			    	        -536 246 -1040 578 -1469 160 -207 460 -474 684 -609 123 -75 354 -183 478
			    	        -226 120 -40 321 -91 404 -101 l56 -7 0 -249 0 -249 -416 0 c-270 0 -431 -4
			    	        -459 -11 -54 -14 -118 -67 -148 -123 -20 -38 -22 -54 -22 -216 0 -161 2 -178
			    	        22 -216 29 -54 93 -110 140 -123 53 -15 2413 -15 2466 0 47 13 111 69 140 123
			    	        20 38 22 55 22 216 0 162 -2 178 -22 216 -30 56 -94 109 -148 123 -28 7 -189
			    	        11 -459 11 l-416 0 0 245 0 244 38 6 c563 97 1039 339 1422 725 396 398 632
			    	        870 726 1450 22 134 33 1048 14 1119 -13 51 -68 114 -124 144 -38 20 -55 22
			    	        -216 22 -160 0 -178 -2 -215 -22 -47 -25 -85 -64 -111 -113 -18 -32 -19 -73
			    	        -25 -525 -6 -531 -8 -558 -69 -775 -16 -58 -51 -157 -77 -220 -346 -815 -1223
			    	        -1277 -2087 -1099 -670 139 -1231 685 -1415 1379 -61 232 -64 257 -70 750 -6
			    	        441 -7 456 -28 495 -25 47 -64 86 -113 111 -29 15 -62 19 -190 21 -85 1 -168
			    	        -2 -185 -6z"
									/>
								</g>
							</svg>
							<svg
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="745.000000pt"
								viewBox="0 0 512.000000 745.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,745.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M2382 7439 c-538 -73 -987 -448 -1151 -962 -68 -212 -64 -135 -68
			    	        -1497 -3 -839 -1 -1275 7 -1361 54 -634 493 -1129 1120 -1265 121 -27 419 -27
			    	        540 0 292 63 526 192 729 401 232 239 362 525 391 864 8 86 10 522 7 1361 -3
			    	        1105 -5 1244 -20 1317 -40 196 -123 396 -229 551 -72 106 -263 295 -368 363
			    	        -160 106 -316 171 -498 209 -114 24 -350 34 -460 19z"
									/>
									<path
										d="M185 4651 c-78 -20 -156 -90 -174 -158 -14 -50 -14 -729 -1 -883 48
			    	        -536 246 -1040 578 -1469 160 -207 460 -474 684 -609 123 -75 354 -183 478
			    	        -226 120 -40 321 -91 404 -101 l56 -7 0 -249 0 -249 -416 0 c-270 0 -431 -4
			    	        -459 -11 -54 -14 -118 -67 -148 -123 -20 -38 -22 -54 -22 -216 0 -161 2 -178
			    	        22 -216 29 -54 93 -110 140 -123 53 -15 2413 -15 2466 0 47 13 111 69 140 123
			    	        20 38 22 55 22 216 0 162 -2 178 -22 216 -30 56 -94 109 -148 123 -28 7 -189
			    	        11 -459 11 l-416 0 0 245 0 244 38 6 c563 97 1039 339 1422 725 396 398 632
			    	        870 726 1450 22 134 33 1048 14 1119 -13 51 -68 114 -124 144 -38 20 -55 22
			    	        -216 22 -160 0 -178 -2 -215 -22 -47 -25 -85 -64 -111 -113 -18 -32 -19 -73
			    	        -25 -525 -6 -531 -8 -558 -69 -775 -16 -58 -51 -157 -77 -220 -346 -815 -1223
			    	        -1277 -2087 -1099 -670 139 -1231 685 -1415 1379 -61 232 -64 257 -70 750 -6
			    	        441 -7 456 -28 495 -25 47 -64 86 -113 111 -29 15 -62 19 -190 21 -85 1 -168
			    	        -2 -185 -6z"
									/>
								</g>
							</svg>
						</a>
					</li>
					<li>
						<a
							id={styles.buttonWebcam}
							onClick={webcamButtonClicked}
							className={isWebcamOn ? styles.activeOn : styles.activeOff}
						>
							<svg
								className="glow"
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="512.000000pt"
								viewBox="0 0 512.000000 512.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M730 4384 c-205 -32 -330 -91 -468 -219 -110 -102 -192 -235 -234
			       	  -382 l-23 -78 0 -1145 0 -1145 23 -78 c68 -237 234 -430 457 -533 158 -73 80
			       	  -69 1350 -69 l1140 0 90 28 c320 100 548 369 585 693 5 49 10 197 10 329 l0
			       	  240 593 -592 c531 -530 596 -593 635 -603 76 -20 164 14 203 77 l24 38 0 1616
			       	  0 1615 -25 38 c-43 64 -127 95 -202 76 -39 -10 -104 -73 -635 -603 l-593 -592
			       	  0 240 c0 132 -5 280 -10 329 -37 324 -265 593 -585 693 l-90 28 -1110 1 c-610
			       	  1 -1121 0 -1135 -2z"
									/>
								</g>
							</svg>
							<svg
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="512.000000pt"
								viewBox="0 0 512.000000 512.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M730 4384 c-205 -32 -330 -91 -468 -219 -110 -102 -192 -235 -234
			    	  -382 l-23 -78 0 -1145 0 -1145 23 -78 c68 -237 234 -430 457 -533 158 -73 80
			    	  -69 1350 -69 l1140 0 90 28 c320 100 548 369 585 693 5 49 10 197 10 329 l0
			    	  240 593 -592 c531 -530 596 -593 635 -603 76 -20 164 14 203 77 l24 38 0 1616
			    	  0 1615 -25 38 c-43 64 -127 95 -202 76 -39 -10 -104 -73 -635 -603 l-593 -592
			    	  0 240 c0 132 -5 280 -10 329 -37 324 -265 593 -585 693 l-90 28 -1110 1 c-610
			    	  1 -1121 0 -1135 -2z"
									/>
								</g>
							</svg>
						</a>
					</li>
					<li style={{ display: checkIsMobile() ? 'none' : 'inline' }}>
						<a
							id={styles.buttonShare}
							onClick={shareButtonClicked}
							className={isShareOn ? styles.activeOn : styles.activeOff}
						>
							<svg
								className="glow"
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="512.000000pt"
								viewBox="0 0 512.000000 512.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M348 4770 c-112 -19 -245 -117 -297 -218 -53 -104 -51 -39 -51 -1643
			       	    0 -962 4 -1505 10 -1540 28 -148 138 -271 295 -328 34 -12 165 -15 808 -18
			       	    l768 -4 -7 -47 c-11 -79 -43 -171 -105 -303 -62 -133 -71 -177 -45 -228 22
			       	    -41 81 -89 118 -96 18 -3 353 -5 744 -3 l710 3 37 25 c45 31 77 87 77 136 0
			       	    25 -19 79 -59 163 -62 132 -94 224 -105 303 l-7 47 768 4 c643 3 774 6 808 18
			       	    158 58 268 180 295 330 7 36 9 565 8 1565 l-3 1509 -23 58 c-44 109 -140 205
			       	    -250 249 l-57 23 -2195 1 c-1207 1 -2216 -2 -2242 -6z m4371 -341 c64 -23 61
			       	    45 61 -1193 l0 -1124 -26 -31 -26 -31 -2168 0 -2168 0 -26 31 -26 31 0 1123
			       	    c0 866 3 1130 12 1151 26 56 -100 53 2204 54 1535 0 2140 -3 2163 -11z"
									/>
								</g>
							</svg>

							<svg
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="512.000000pt"
								viewBox="0 0 512.000000 512.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M348 4770 c-112 -19 -245 -117 -297 -218 -53 -104 -51 -39 -51 -1643
			    	    0 -962 4 -1505 10 -1540 28 -148 138 -271 295 -328 34 -12 165 -15 808 -18
			    	    l768 -4 -7 -47 c-11 -79 -43 -171 -105 -303 -62 -133 -71 -177 -45 -228 22
			    	    -41 81 -89 118 -96 18 -3 353 -5 744 -3 l710 3 37 25 c45 31 77 87 77 136 0
			    	    25 -19 79 -59 163 -62 132 -94 224 -105 303 l-7 47 768 4 c643 3 774 6 808 18
			    	    158 58 268 180 295 330 7 36 9 565 8 1565 l-3 1509 -23 58 c-44 109 -140 205
			    	    -250 249 l-57 23 -2195 1 c-1207 1 -2216 -2 -2242 -6z m4371 -341 c64 -23 61
			    	    45 61 -1193 l0 -1124 -26 -31 -26 -31 -2168 0 -2168 0 -26 31 -26 31 0 1123
			    	    c0 866 3 1130 12 1151 26 56 -100 53 2204 54 1535 0 2140 -3 2163 -11z"
									/>
								</g>
							</svg>
						</a>
					</li>
					<li style={{ display: checkIsMobile() ? 'none' : 'inline' }}>
						<a
							id={styles.buttonControls}
							onClick={controlsButtonClicked}
							className={isUiContainerOn ? styles.activeOn : styles.activeOff}
						>
							<svg
								className="glow"
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="94.000000pt"
								viewBox="0 0 256.000000 47.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,94.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M365 926 c-220 -55 -380 -269 -362 -486 28 -336 374 -536 677 -391
			                72 35 171 128 206 195 l28 55 29 -52 c58 -107 179 -201 301 -233 105 -28 238
			                -11 340 44 68 36 154 124 193 197 l32 60 1 -147 0 -148 105 0 105 0 2 249 3
			                250 181 -247 181 -247 92 -3 91 -3 0 451 0 450 -175 0 -175 0 0 -105 0 -105
			                70 0 70 0 0 -146 c0 -116 -3 -144 -12 -136 -7 6 -92 119 -188 251 l-175 240
			                -87 1 -88 0 0 -147 -1 -148 -31 59 c-18 32 -58 84 -89 115 -221 222 -577 174
			                -741 -100 l-34 -56 -28 53 c-15 29 -53 77 -85 107 -121 116 -282 161 -436 123z
			                m1110 -243 c51 -27 79 -57 104 -113 74 -162 -45 -344 -224 -344 -165 1 -287
			                171 -230 321 20 52 75 117 118 139 68 36 160 34 232 -3z m-900 8 c22 -10 59
			                -39 83 -64 l42 -47 98 0 97 0 0 -110 0 -110 -100 0 -100 0 -27 -38 c-40 -57
			                -118 -96 -193 -95 -33 0 -76 7 -96 15 -184 79 -201 332 -29 436 47 27 63 32
			                120 32 41 0 80 -7 105 -19z"
									/>
									<path
										d="M4043 925 c-124 -34 -246 -127 -300 -231 -30 -58 -43 -67 -43 -31 0
			                41 -46 121 -96 168 -83 76 -115 84 -359 84 l-210 0 0 -445 0 -445 107 -3 107
			                -3 3 150 3 150 104 -150 103 -149 135 0 135 0 -28 37 c-15 21 -63 84 -106 141
			                -43 57 -78 106 -78 110 0 4 23 22 51 40 27 18 63 53 79 78 l29 46 6 -39 c21
			                -134 54 -203 136 -289 186 -192 483 -192 673 1 28 29 63 76 78 105 l27 53 3
			                -139 3 -139 258 -3 257 -2 0 100 0 100 -150 0 -150 0 -2 348 -3 347 -105 0
			                -105 0 -5 -137 -5 -138 -29 55 c-94 180 -327 282 -523 230z m-620 -227 c27
			                -14 57 -69 57 -106 0 -81 -55 -122 -164 -122 l-66 0 0 119 0 120 43 3 c52 4
			                106 -2 130 -14z m826 -5 c93 -37 151 -124 151 -224 0 -146 -138 -266 -281
			                -243 -61 10 -139 62 -172 115 -124 201 83 442 302 352z"
									/>
									<path
										d="M2607 913 c-4 -3 -7 -206 -7 -450 l0 -443 104 0 c99 0 104 1 110 22
			                3 13 6 168 6 344 l0 321 90 7 90 8 0 99 0 99 -193 0 c-107 0 -197 -3 -200 -7z"
									/>
								</g>
							</svg>
							<svg
								version="1.0"
								xmlns="http://www.w3.org/2000/svg"
								width="512.000000pt"
								height="94.000000pt"
								viewBox="0 0 256.000000 47.000000"
								preserveAspectRatio="xMidYMid meet"
							>
								<g
									transform="translate(0.000000,94.000000) scale(0.100000,-0.100000)"
									fill="#000000"
									stroke="none"
								>
									<path
										d="M365 926 c-220 -55 -380 -269 -362 -486 28 -336 374 -536 677 -391
			    	      72 35 171 128 206 195 l28 55 29 -52 c58 -107 179 -201 301 -233 105 -28 238
			    	      -11 340 44 68 36 154 124 193 197 l32 60 1 -147 0 -148 105 0 105 0 2 249 3
			    	      250 181 -247 181 -247 92 -3 91 -3 0 451 0 450 -175 0 -175 0 0 -105 0 -105
			    	      70 0 70 0 0 -146 c0 -116 -3 -144 -12 -136 -7 6 -92 119 -188 251 l-175 240
			    	      -87 1 -88 0 0 -147 -1 -148 -31 59 c-18 32 -58 84 -89 115 -221 222 -577 174
			    	      -741 -100 l-34 -56 -28 53 c-15 29 -53 77 -85 107 -121 116 -282 161 -436 123z
			    	      m1110 -243 c51 -27 79 -57 104 -113 74 -162 -45 -344 -224 -344 -165 1 -287
			    	      171 -230 321 20 52 75 117 118 139 68 36 160 34 232 -3z m-900 8 c22 -10 59
			    	      -39 83 -64 l42 -47 98 0 97 0 0 -110 0 -110 -100 0 -100 0 -27 -38 c-40 -57
			    	      -118 -96 -193 -95 -33 0 -76 7 -96 15 -184 79 -201 332 -29 436 47 27 63 32
			    	      120 32 41 0 80 -7 105 -19z"
									/>
									<path
										d="M4043 925 c-124 -34 -246 -127 -300 -231 -30 -58 -43 -67 -43 -31 0
			    	      41 -46 121 -96 168 -83 76 -115 84 -359 84 l-210 0 0 -445 0 -445 107 -3 107
			    	      -3 3 150 3 150 104 -150 103 -149 135 0 135 0 -28 37 c-15 21 -63 84 -106 141
			    	      -43 57 -78 106 -78 110 0 4 23 22 51 40 27 18 63 53 79 78 l29 46 6 -39 c21
			    	      -134 54 -203 136 -289 186 -192 483 -192 673 1 28 29 63 76 78 105 l27 53 3
			    	      -139 3 -139 258 -3 257 -2 0 100 0 100 -150 0 -150 0 -2 348 -3 347 -105 0
			    	      -105 0 -5 -137 -5 -138 -29 55 c-94 180 -327 282 -523 230z m-620 -227 c27
			    	      -14 57 -69 57 -106 0 -81 -55 -122 -164 -122 l-66 0 0 119 0 120 43 3 c52 4
			    	      106 -2 130 -14z m826 -5 c93 -37 151 -124 151 -224 0 -146 -138 -266 -281
			    	      -243 -61 10 -139 62 -172 115 -124 201 83 442 302 352z"
									/>
									<path
										d="M2607 913 c-4 -3 -7 -206 -7 -450 l0 -443 104 0 c99 0 104 1 110 22
			    	      3 13 6 168 6 344 l0 321 90 7 90 8 0 99 0 99 -193 0 c-107 0 -197 -3 -200 -7z"
									/>
								</g>
							</svg>
						</a>
					</li>
				</ul>
			</div>
		</footer>
	);
}

export default Footer;

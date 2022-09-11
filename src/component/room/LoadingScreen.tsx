import './LoadingScreen.css';
import { useEffect, useState } from 'react';

function LoadingScreen(props) {
	const [isLoding, setIsLoding] = useState(true);

	useEffect(() => {
		document.addEventListener('loading-screen-event', function (event) {
			setIsLoding(false);
		});
	}, []);

	return (
		<div
			id="loading-screen"
			className="kenburns-bottom"
			style={{ display: isLoding ? 'flex' : 'none' }}
		>
			<div className="loading-screen-background"></div>
			<div className="kenburns-bottom"></div>
			<div className="loading-title text-pop-up-top">Meta World</div>

			<div className="loading-text tracking-in-contract">Loading...</div>
		</div>
	);
}

export default LoadingScreen;

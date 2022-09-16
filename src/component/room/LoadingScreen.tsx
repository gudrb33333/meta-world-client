import './LoadingScreen.css';
import { useEffect, useState } from 'react';

function LoadingScreen(props) {
	const [isLoading, setIsLoading] = useState(props.isLoading);

	useEffect(() => {
    	setIsLoading(props.isLoading);
    }, [props.isLoading]);
    

	return (
		<div
			id="loading-screen"
			className="kenburns-bottom"
			style={{ display: isLoading ? 'flex' : 'none' }}
		>
			<div className="loading-screen-background"></div>
			<div className="kenburns-bottom"></div>
			<div className="loading-title text-pop-up-top">Meta World</div>

			<div className="loading-text tracking-in-contract">Loading...</div>
		</div>
	);
}

export default LoadingScreen;

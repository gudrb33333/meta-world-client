import './App.css';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './component/home/Home';
import Avatar from './component/avatar/Avatar';
import Room from './component/room/Room';
import { isIOS, isAndroid } from './utils/isMobile';

import screenfull from 'screenfull';

function App() {

	useEffect(() => {
		if(isAndroid || isIOS) {
			const handleClick = () => {
				if (screenfull.isEnabled) {
				  screenfull.request().then(() => {
					console.log('changed to fullscreen');
				  }).catch((error) => {
					console.warn('faild changed to fullscreen:', error);
				  });
				}
			};

			document.addEventListener('touchstart', handleClick);
			
			return () => {
				document.removeEventListener('touchstart', handleClick);
			};
		}
	}, []);

	return (
		<Router>
			<Routes>
				<Route path="/avatar" element={<Avatar />} />
				<Route path="/room" element={<Room />} />
				<Route path="/" element={<Home />} />
				<Route path="*" element={<Home />} />
			</Routes>
		</Router>
	);
}

export default App;

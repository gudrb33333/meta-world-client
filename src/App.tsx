import './App.css';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AvatarPage from './pages/AvatarPage';
import RoomPage from './pages/RoomPage';
import RoomLobbyPage from './pages/RoomLobbyPage';

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/avatar" element={<AvatarPage />} />
				<Route path="/rooms/:roomName" element={<RoomPage />} />
				<Route path="/lobby" element={<RoomLobbyPage />} />
				<Route path="/" element={<HomePage />} />
				<Route path="*" element={<HomePage />} />
			</Routes>
		</Router>
	);
}

export default App;

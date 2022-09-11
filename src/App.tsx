import './App.css';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import Home from './component/home/Home';
import Avatar from './component/avatar/Avatar';
import Room from './component/room/Room';
import AvatarList from './component/avatar/AvatarList';

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/avatar" element={<Avatar />} />
				<Route path="/avatar-list" element={<AvatarList />} />
				<Route path="/room" element={<Room />} />
				<Route path="/" element={<Home />} />
				<Route path="*" element={<Home />} />
			</Routes>
		</Router>
	);
}

export default App;

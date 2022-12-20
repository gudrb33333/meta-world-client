import './App.css';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import Home from './component/home/Home';
import Avatar from './component/avatar/Avatar';
import Room from './component/room/Room';
import Navbar from './component/room/Sidebar';

function App() {
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

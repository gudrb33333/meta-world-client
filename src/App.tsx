import './App.css';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import Home from './components/Home';
import Avatar from './components/Avatar';
import Room from './components/Room';

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

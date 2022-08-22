import './App.css';
import { Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import Home from './component/home/home';
import Avatar from './component/Avatar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/avatar" element={<Avatar />}/>
      </Routes>
    </Router>
  );
}

export default App;

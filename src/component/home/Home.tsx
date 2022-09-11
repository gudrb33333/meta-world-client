import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
	return (
		<div className="home fade-in">
			<div className="home-screen">
				<div className="home-title text-flicker-in-glow">Meta World</div>
				<div className="home-button-container">
					<Link to="/avatar">
						<button className="home-create-avatar-button pushable slide-in-left">
							<span className="shadow"></span>
							<span className="edge"></span>
							<span className="front">아바타 만들기</span>
						</button>
					</Link>
					<Link to="/avatar-list">
						<button className="pushable slide-in-right">
							<span className="shadow"></span>
							<span className="edge"></span>
							<span className="front">캐릭터 선택</span>
						</button>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default Home;

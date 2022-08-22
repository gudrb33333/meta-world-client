import { Link } from "react-router-dom";
import './Home.css'

function Home() {
  return (
    <div className="home">
        <Link to="/avatar">
          <button>아바타 만들기</button>
        </Link>
        <Link to="/avatar-list">
          <button>이미 만들어진 캐릭터 선택</button>
        </Link>
    </div>
  );
}

export default Home;
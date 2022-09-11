import { useEffect, useState } from 'react';
import './UiContainer.css';

function UiContainer(props) {
	const [isLoding, setIsLoding] = useState(false);

	useEffect(() => {
		document.addEventListener('ui-container-event', function (event) {
			setIsLoding(true);
		});
	}, []);

	return (
		<div id="ui-container" style={{ display: isLoding ? 'block' : 'none' }}>
			<div className="left-panel">
				<div id="controls" className="panel-segment flex-bottom"></div>
				<h2 className="controls-title">Controls:</h2>
				<div className="ctrl-row">
					<span className="ctrl-key">W</span>
					<span className="ctrl-key">A</span>
					<span className="ctrl-key">S</span>
					<span className="ctrl-key">D</span>
					<span className="ctrl-desc">Movement</span>
				</div>
				<div className="ctrl-row">
					<span className="ctrl-key">Shift</span>
					<span className="ctrl-desc">Sprint</span>
				</div>
				<div className="ctrl-row">
					<span className="ctrl-key">Space</span>
					<span className="ctrl-desc">Jump</span>
				</div>
			</div>
		</div>
	);
}

export default UiContainer;

import { useEffect, useState } from 'react';
import './UiContainer.css';

function UiContainer(props) {
	const [isLoading, setIsLoading] = useState(props.isLoading);
	const [isUiContainerOn, setIsUiContainerOn] = useState(props.isUiContainerOn);

	useEffect(() => {
    	setIsLoading(props.isLoading);
		setIsUiContainerOn(props.isUiContainerOn)
    }, [props.isLoading, props.isUiContainerOn]);

	return (
		<div id="ui-container" style={{ display: !isLoading && isUiContainerOn? 'block' : 'none' }}>
			<div className="left-panel">
				<div id="controls" className="panel-segment flex-bottom"></div>
				<h2 className="controls-title">Controls</h2>
				<div className="ctrl-row">
					<span className="ctrl-key">W</span>
					<span className="ctrl-key">A</span>
					<span className="ctrl-key">S</span>
					<span className="ctrl-key">D</span>
					<span className="ctrl-desc">방향키</span>
				</div>
				<div className="ctrl-row">
					<span className="ctrl-key">Shift</span>
					<span className="ctrl-desc">달리기</span>
				</div>
				<div className="ctrl-row">
					<span className="ctrl-key">Space</span>
					<span className="ctrl-desc">점프</span>
				</div>
				<div className="ctrl-row">
					<span className="ctrl-key">G</span>
					<span className="ctrl-key">F</span>
					<span className="ctrl-desc">의자 앉기/일어나기</span>
				</div>
			</div>
		</div>
	);
}

export default UiContainer;

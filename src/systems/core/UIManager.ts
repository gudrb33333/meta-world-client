import LoadingScreen from 'src/component/room/LoadingScreen';

export class UIManager {
	public static setUserInterfaceVisible(value: boolean): void {
		document.dispatchEvent(new Event('ui-container-event'));
		//document.getElementById('ui-container').style.display = value ? 'block' : 'none';
	}

	public static setLoadingScreenVisible(value: boolean): void {
		document.dispatchEvent(new Event('loading-screen-event'));
		document.dispatchEvent(new Event('room-footer-event'));
		//document.getElementById('loading-screen').style.display = value ? 'flex' : 'none';
	}

	public static setFPSVisible(value: boolean): void {
		document.getElementById('statsBox').style.display = value ? 'block' : 'none';
		document.getElementById('dat-gui-container').style.top = value ? '48px' : '0px';
	}
}

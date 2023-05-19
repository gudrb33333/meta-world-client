import { World } from "../world/World";

export class AudioFrequencyAnalyser {

    private _world: World;

	private _analyser;
	private _frequencyData: Uint8Array;

    constructor(world: World) {
        this._world = world;
		// initialize the audioContext
		const AudioContext = window.AudioContext  || (window as any).webkitAudioContext;
		var audioContext = new AudioContext();
		this._analyser = audioContext.createAnalyser();
		var mediaSource = audioContext.createMediaElementSource(this._world.localVideoSceen.localVideo);

		mediaSource.connect(this._analyser);
		this._analyser.connect(audioContext.destination);	
		this._analyser.fftSize = 32;
		this._frequencyData = new Uint8Array(this._analyser.frequencyBinCount);
    }

    public getSumOfFrequencyData(): number {
        this._analyser.getByteFrequencyData(this._frequencyData);

        this._frequencyData[0] -= 200;
        this._frequencyData[1] -= 100;
        this._frequencyData[2] -= 50;

        let sumOfFrequencyData = 0;
        this._frequencyData.forEach((frequencyData) => {
            sumOfFrequencyData += frequencyData;
        })

        sumOfFrequencyData = ((sumOfFrequencyData)/ 1600) - 0.1;

        if(sumOfFrequencyData < 0.3){
            sumOfFrequencyData = 0.3
        }

        return sumOfFrequencyData;
    }
}

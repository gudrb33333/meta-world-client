import { World } from './World';
import { DirectionalLight, HemisphereLight } from 'three';

export class Light {

    private _world: World;

    constructor(world: World, lightValue) {
        this._world = world;
        
		const ambientLight = new HemisphereLight(
			'white', // bright sky color
			'darkslategrey', // dim ground color
			lightValue, // intensity
		);
		this._world.graphicsWorld.add(ambientLight);

		const mainLight = new DirectionalLight('white', lightValue);
		mainLight.position.set(10, 10, 10);
		this._world.graphicsWorld.add(mainLight);
    }
}

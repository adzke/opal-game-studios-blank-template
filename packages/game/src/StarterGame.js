import * as THREE from 'three';
import {
    COLLECTIBLE_RADIUS,
    PLAYER_RADIUS,
    createInitialState,
    serializeGameState,
    stepGameState
} from './gameState.js';
import { createVirtualJoystick } from './virtualJoystick.js';

const FRAME_MS = 1000 / 60;
const KEY_BINDINGS = {
    ArrowUp: { axis: 'z', value: -1 },
    ArrowDown: { axis: 'z', value: 1 },
    ArrowLeft: { axis: 'x', value: -1 },
    ArrowRight: { axis: 'x', value: 1 },
    w: { axis: 'z', value: -1 },
    W: { axis: 'z', value: -1 },
    s: { axis: 'z', value: 1 },
    S: { axis: 'z', value: 1 },
    a: { axis: 'x', value: -1 },
    A: { axis: 'x', value: -1 },
    d: { axis: 'x', value: 1 },
    D: { axis: 'x', value: 1 }
};

function createRandomSource() {
    return Math.random;
}

function resolveReleasedInput(currentValue, pressedValue) {
    return currentValue === pressedValue ? 0 : currentValue;
}

export class StarterGame {
    constructor({ container, initialScore = 0, onScoreChange, onStateChange }) {
        this.container = container;
        this.initialScore = initialScore;
        this.onScoreChange = onScoreChange;
        this.onStateChange = onStateChange;
        this.random = createRandomSource();
        this.state = createInitialState({ score: initialScore, random: this.random });
        this.input = { x: 0, z: 0 };
        this.joystickInput = { x: 0, z: 0 };
        this.animationFrame = null;
        this.lastTimestamp = 0;
        this.cleanup = [];
    }

    async init() {
        await this.initializePhysics();
        this.createScene();
        this.createActors();
        this.bindEvents();
        this.joystick = createVirtualJoystick({
            root: this.container,
            onMove: (vector) => {
                this.joystickInput = vector;
            }
        });
        this.notifyState();
        this.render();
        this.start();
    }

    async initializePhysics() {
        const RAPIER = await import('@dimforge/rapier3d-compat');
        await RAPIER.init();
        this.RAPIER = RAPIER;
        this.world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#f8fafc');
        this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
        this.camera.position.set(0, 8.5, 7.2);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.domElement.className = 'starter-game__canvas';
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
        const directionalLight = new THREE.DirectionalLight('#ffffff', 1.4);
        directionalLight.position.set(4, 10, 6);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(14, 14),
            new THREE.MeshStandardMaterial({ color: '#e2e8f0' })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);

        const border = new THREE.Mesh(
            new THREE.RingGeometry(5.8, 6, 48),
            new THREE.MeshBasicMaterial({ color: '#cbd5e1', side: THREE.DoubleSide })
        );
        border.rotation.x = -Math.PI / 2;
        border.position.y = 0.01;
        this.scene.add(border);

        this.handleResize();
    }

    createActors() {
        const playerBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, PLAYER_RADIUS, 0);
        this.playerBody = this.world.createRigidBody(playerBodyDesc);
        this.world.createCollider(this.RAPIER.ColliderDesc.ball(PLAYER_RADIUS), this.playerBody);

        const collectibleBodyDesc = this.RAPIER.RigidBodyDesc.fixed().setTranslation(
            this.state.collectible.x,
            COLLECTIBLE_RADIUS,
            this.state.collectible.z
        );
        this.collectibleBody = this.world.createRigidBody(collectibleBodyDesc);
        this.world.createCollider(this.RAPIER.ColliderDesc.ball(COLLECTIBLE_RADIUS).setSensor(true), this.collectibleBody);

        this.playerMesh = new THREE.Mesh(
            new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32),
            new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.18, roughness: 0.22 })
        );
        this.collectibleMesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(COLLECTIBLE_RADIUS, 0),
            new THREE.MeshStandardMaterial({ color: '#2563eb', emissive: '#93c5fd', emissiveIntensity: 0.25 })
        );

        this.playerMesh.position.set(0, PLAYER_RADIUS, 0);
        this.collectibleMesh.position.set(this.state.collectible.x, COLLECTIBLE_RADIUS, this.state.collectible.z);

        this.scene.add(this.playerMesh);
        this.scene.add(this.collectibleMesh);
    }

    bindEvents() {
        const keydown = (event) => {
            this.setInputState(event.key, true);
        };
        const keyup = (event) => {
            this.setInputState(event.key, false);
        };
        const resize = () => {
            this.handleResize();
        };

        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);
        window.addEventListener('resize', resize);

        this.cleanup.push(() => window.removeEventListener('keydown', keydown));
        this.cleanup.push(() => window.removeEventListener('keyup', keyup));
        this.cleanup.push(() => window.removeEventListener('resize', resize));
    }

    setInputState(key, active) {
        const binding = KEY_BINDINGS[key];
        if (!binding) {
            return;
        }

        this.input[binding.axis] = active
            ? binding.value
            : resolveReleasedInput(this.input[binding.axis], binding.value);
    }

    getCombinedInput() {
        return {
            x: this.input.x + this.joystickInput.x,
            z: this.input.z + this.joystickInput.z
        };
    }

    start() {
        const loop = (timestamp) => {
            if (!this.lastTimestamp) {
                this.lastTimestamp = timestamp;
            }

            const delta = (timestamp - this.lastTimestamp) / 1000;
            this.lastTimestamp = timestamp;
            this.step(delta);
            this.animationFrame = window.requestAnimationFrame(loop);
        };

        this.animationFrame = window.requestAnimationFrame(loop);
    }

    advance(ms) {
        const steps = Math.max(1, Math.round(ms / FRAME_MS));
        for (let step = 0; step < steps; step += 1) {
            this.step(FRAME_MS / 1000);
        }
    }

    step(delta) {
        const result = stepGameState(this.state, this.getCombinedInput(), delta, this.random);
        this.state = result.state;
        this.syncBodies();
        if (result.didCollect && typeof this.onScoreChange === 'function') {
            this.onScoreChange(this.state.score);
        }
        this.render(delta);
        this.notifyState();
    }

    syncBodies() {
        this.playerBody.setNextKinematicTranslation({
            x: this.state.player.x,
            y: PLAYER_RADIUS,
            z: this.state.player.z
        });
        this.collectibleBody.setTranslation(
            {
                x: this.state.collectible.x,
                y: COLLECTIBLE_RADIUS,
                z: this.state.collectible.z
            },
            true
        );
        this.world.step();

        this.playerMesh.position.set(this.state.player.x, PLAYER_RADIUS, this.state.player.z);
        this.collectibleMesh.position.set(this.state.collectible.x, COLLECTIBLE_RADIUS, this.state.collectible.z);
    }

    render(delta = 0) {
        if (this.collectibleMesh) {
            this.collectibleMesh.rotation.y += delta * 1.8;
        }
        this.camera.lookAt(this.state.player.x * 0.15, 0, this.state.player.z * 0.15);
        this.renderer.render(this.scene, this.camera);
    }

    notifyState() {
        if (typeof this.onStateChange === 'function') {
            this.onStateChange({
                score: this.state.score,
                state: this.state
            });
        }
    }

    restart() {
        this.state = createInitialState({ score: 0, random: this.random });
        this.syncBodies();
        this.render();
        this.notifyState();
    }

    renderGameToText() {
        return serializeGameState(this.state);
    }

    getState() {
        return this.state;
    }

    handleResize() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    destroy() {
        if (this.animationFrame) {
            window.cancelAnimationFrame(this.animationFrame);
        }
        this.cleanup.forEach((dispose) => dispose());
        this.joystick?.destroy();
        this.renderer?.dispose();
        this.container.replaceChildren();
    }
}

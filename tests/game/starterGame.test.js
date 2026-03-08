import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('three', () => {
    class Mesh {
        constructor() {
            this.position = { set: vi.fn() };
            this.rotation = { x: 0, y: 0 };
        }
    }

    return {
        Scene: class {
            constructor() {
                this.add = vi.fn();
                this.background = null;
            }
        },
        Color: class {
            constructor(value) {
                this.value = value;
            }
        },
        PerspectiveCamera: class {
            constructor() {
                this.position = { set: vi.fn() };
                this.aspect = 1;
                this.lookAt = vi.fn();
                this.updateProjectionMatrix = vi.fn();
            }
        },
        WebGLRenderer: class {
            constructor() {
                this.domElement = document.createElement('canvas');
                this.setPixelRatio = vi.fn();
                this.render = vi.fn();
                this.setSize = vi.fn();
                this.dispose = vi.fn();
            }
        },
        AmbientLight: class {},
        DirectionalLight: class {
            constructor() {
                this.position = { set: vi.fn() };
            }
        },
        PlaneGeometry: class {},
        MeshStandardMaterial: class {},
        RingGeometry: class {},
        MeshBasicMaterial: class {},
        SphereGeometry: class {},
        IcosahedronGeometry: class {},
        Mesh,
        DoubleSide: 'DoubleSide'
    };
});

vi.mock('@dimforge/rapier3d-compat', () => {
    class Desc {
        constructor() {
            this.translation = { x: 0, y: 0, z: 0 };
        }

        setTranslation(x, y, z) {
            this.translation = { x, y, z };
            return this;
        }

        setSensor() {
            return this;
        }
    }

    return {
        init: vi.fn(async () => {}),
        World: class {
            createRigidBody() {
                return {
                    setNextKinematicTranslation: vi.fn(),
                    setTranslation: vi.fn()
                };
            }

            createCollider() {
                return {};
            }

            step() {}
        },
        RigidBodyDesc: {
            kinematicPositionBased() {
                return new Desc();
            },
            fixed() {
                return new Desc();
            }
        },
        ColliderDesc: {
            ball() {
                return new Desc();
            }
        }
    };
});

import { StarterGame } from '../../packages/game/src/StarterGame.js';

describe('StarterGame', () => {
    beforeEach(() => {
        window.requestAnimationFrame = vi.fn(() => 1);
        window.cancelAnimationFrame = vi.fn();
    });

    it('initializes, renders text state, collects targets, and restarts', async () => {
        const container = document.createElement('div');
        Object.defineProperty(container, 'clientWidth', { value: 800 });
        Object.defineProperty(container, 'clientHeight', { value: 500 });
        document.body.appendChild(container);

        const scoreSpy = vi.fn();
        const game = new StarterGame({
            container,
            initialScore: 0,
            onScoreChange: scoreSpy,
            onStateChange: vi.fn()
        });

        await game.init();
        game.state.collectible = { x: 0, z: 0 };
        game.step(1 / 60);

        expect(scoreSpy).toHaveBeenCalledWith(1);
        expect(JSON.parse(game.renderGameToText()).score).toBe(1);

        game.restart();
        expect(game.getState().score).toBe(0);

        game.destroy();
        expect(container.childElementCount).toBe(0);
    });
});

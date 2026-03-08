import { describe, expect, it, vi } from 'vitest';
import { computeJoystickVector, createVirtualJoystick } from '../../packages/game/src/virtualJoystick.js';

function createPointerLikeEvent(type, payload) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, payload);
    return event;
}

describe('virtualJoystick', () => {
    it('computes a normalized joystick vector from pointer coordinates', () => {
        const rect = {
            left: 0,
            top: 0,
            width: 100,
            height: 100
        };

        expect(computeJoystickVector(50, 50, rect)).toEqual({ x: 0, z: 0 });
        expect(computeJoystickVector(100, 50, rect).x).toBe(1);
        expect(computeJoystickVector(50, 0, rect).z).toBe(-1);
    });

    it('creates a joystick shell, emits movement, and tears down cleanly', () => {
        const root = document.createElement('div');
        document.body.appendChild(root);
        const onMove = vi.fn();
        const controller = createVirtualJoystick({ root, onMove });
        const shell = root.querySelector('.starter-joystick');

        shell.setPointerCapture = vi.fn();
        shell.getBoundingClientRect = () => ({
            left: 0,
            top: 0,
            width: 100,
            height: 100
        });

        shell.dispatchEvent(createPointerLikeEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 50 }));
        shell.dispatchEvent(createPointerLikeEvent('pointermove', { pointerId: 1, clientX: 75, clientY: 25 }));
        shell.dispatchEvent(createPointerLikeEvent('pointerup', { pointerId: 1, clientX: 50, clientY: 50 }));

        expect(onMove).toHaveBeenCalled();

        controller.destroy();
        expect(root.querySelector('.starter-joystick')).toBeNull();
    });
});

export function computeJoystickVector(clientX, clientY, rect) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.min(radius, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    return {
        x: Number((Math.cos(angle) * distance / radius).toFixed(3)),
        z: Number((Math.sin(angle) * distance / radius).toFixed(3))
    };
}

export function createVirtualJoystick({ root, onMove }) {
    const shell = document.createElement('div');
    const knob = document.createElement('div');

    shell.className = 'starter-joystick';
    knob.className = 'starter-joystick__knob';
    shell.appendChild(knob);
    root.appendChild(shell);

    let pointerId = null;

    const reset = () => {
        knob.style.transform = 'translate(-50%, -50%)';
        onMove({ x: 0, z: 0 });
    };

    const handlePointerMove = (event) => {
        if (pointerId !== event.pointerId) {
            return;
        }

        const rect = shell.getBoundingClientRect();
        const nextVector = computeJoystickVector(event.clientX, event.clientY, rect);
        knob.style.transform = `translate(calc(-50% + ${nextVector.x * 26}px), calc(-50% + ${nextVector.z * 26}px))`;
        onMove(nextVector);
    };

    shell.addEventListener('pointerdown', (event) => {
        pointerId = event.pointerId;
        shell.setPointerCapture(pointerId);
        handlePointerMove(event);
    });

    shell.addEventListener('pointermove', handlePointerMove);
    shell.addEventListener('pointerup', (event) => {
        if (pointerId === event.pointerId) {
            pointerId = null;
            reset();
        }
    });
    shell.addEventListener('pointercancel', reset);

    reset();

    return {
        destroy() {
            shell.remove();
        }
    };
}

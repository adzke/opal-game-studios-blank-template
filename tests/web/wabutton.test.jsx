import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WaButton } from '../../apps/web/components/WebAwesome/WaButton.jsx';

describe('WaButton', () => {
    it('renders safely without an onPress handler', () => {
        const { container } = render(<WaButton appearance="outlined">Play</WaButton>);
        const button = container.querySelector('wa-button');

        expect(button).not.toBeNull();
        expect(button).toHaveAttribute('appearance', 'outlined');
        expect(button).toHaveTextContent('Play');
        expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('binds and removes the click handler', () => {
        const onPress = vi.fn();
        const { container, unmount } = render(<WaButton onPress={onPress}>Play</WaButton>);
        const button = container.querySelector('wa-button');

        fireEvent.click(button);
        expect(onPress).toHaveBeenCalledTimes(1);

        unmount();
        fireEvent.click(button);
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});

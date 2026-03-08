import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../../apps/web/components/Landing/Logo.jsx';

void React;

describe('Logo', () => {
    it('renders a thinner rainbow SVG mark', () => {
        render(<Logo />);

        const logo = screen.getByLabelText('Opal Game Studios logo');

        expect(logo).toHaveAttribute('stroke', 'url(#opal-logo-spectrum)');
        expect(logo).toHaveAttribute('stroke-width', '3');
        expect(logo.querySelector('#opal-logo-spectrum')).not.toBeNull();
    });
});

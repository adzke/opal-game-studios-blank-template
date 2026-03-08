import '@testing-library/jest-dom';

if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.attachInternals === 'undefined') {
    HTMLElement.prototype.attachInternals = function attachInternals() {
        return {
            setFormValue() {},
            setValidity() {},
            checkValidity() {
                return true;
            },
            reportValidity() {
                return true;
            }
        };
    };
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: () => ({
            matches: false,
            addEventListener() {},
            removeEventListener() {}
        })
    });
}

import React from 'react';
import { AuthGuard } from '../../components/Auth/AuthGuard.jsx';

export default function ProtectedLayout({ children }) {
    return <AuthGuard>{children}</AuthGuard>;
}

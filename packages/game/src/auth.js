import SuperTokens from 'supertokens-web-js';
import Session from 'supertokens-web-js/recipe/session';
import EmailPassword from 'supertokens-web-js/recipe/emailpassword';

let authInitialized = false;

export function resolveApiOrigin(explicitApiOrigin) {
    if (explicitApiOrigin) {
        return explicitApiOrigin;
    }

    if (typeof window !== 'undefined' && typeof window.__API_ORIGIN__ === 'string' && window.__API_ORIGIN__) {
        return window.__API_ORIGIN__;
    }

    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return '';
}

export function initAuth({ apiDomain, apiBasePath = '/auth' } = {}) {
    if (authInitialized || typeof window === 'undefined') {
        return;
    }

    SuperTokens.init({
        appInfo: {
            appName: 'Opal Game Studios Template Game',
            apiDomain: resolveApiOrigin(apiDomain),
            apiBasePath,
            websiteBasePath: '/auth'
        },
        recipeList: [
            Session.init({
                tokenTransferMethod: 'header'
            }),
            EmailPassword.init()
        ]
    });

    authInitialized = true;
}

export { EmailPassword, Session };

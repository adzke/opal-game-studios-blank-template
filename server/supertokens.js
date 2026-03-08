import dotenv from 'dotenv';
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword/index.js';
import Session from 'supertokens-node/recipe/session/index.js';
import { createOrRelinkLocalUser } from './userSync.js';

dotenv.config();

let initialized = false;

function logAuthEmail(input) {
    if (process.env.LOG_AUTH_EMAILS === 'true' && input.type === 'PASSWORD_RESET') {
        console.log(`[Auth Email] Reset link for ${input.user.email}: ${input.passwordResetLink}`);
        return true;
    }

    return false;
}

export function initSupertokens() {
    if (initialized) {
        return;
    }

    supertokens.init({
        framework: 'express',
        supertokens: {
            connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'http://localhost:3567'
        },
        appInfo: {
            appName: 'Opal Game Studios Template Game',
            apiDomain: process.env.API_DOMAIN || 'http://localhost:3000',
            websiteDomain: process.env.WEBSITE_DOMAIN || 'http://localhost:3000',
            apiBasePath: '/auth',
            websiteBasePath: '/auth'
        },
        recipeList: [
            EmailPassword.init({
                signUpFeature: {
                    formFields: [
                        {
                            id: 'username'
                        }
                    ]
                },
                override: {
                    apis: (originalImplementation) => ({
                        ...originalImplementation,
                        signUpPOST: async (input) => {
                            const response = await originalImplementation.signUpPOST(input);
                            if (response.status === 'OK') {
                                const usernameField = input.formFields.find((field) => field.id === 'username');
                                await createOrRelinkLocalUser({
                                    supertokensId: response.user.id,
                                    email: response.user.emails[0],
                                    preferredUsername: usernameField?.value || response.user.emails[0]?.split('@')[0]
                                });
                            }
                            return response;
                        },
                        signInPOST: async (input) => {
                            const response = await originalImplementation.signInPOST(input);
                            if (response.status === 'OK') {
                                await createOrRelinkLocalUser({
                                    supertokensId: response.user.id,
                                    email: response.user.emails[0],
                                    preferredUsername: response.user.emails[0]?.split('@')[0]
                                });
                            }
                            return response;
                        }
                    })
                },
                emailDelivery: {
                    override: (originalImplementation) => ({
                        ...originalImplementation,
                        sendEmail: async (input) => {
                            if (!logAuthEmail(input)) {
                                return originalImplementation.sendEmail(input);
                            }
                        }
                    })
                }
            }),
            Session.init(),
        ]
    });

    initialized = true;
}

// src/utils/supabaseUtils.ts
export const redirectToAuth = (redirectUrl: string) => {
    // This is a simple utility, but for more complex cases, you can use a
    // dedicated auth redirect handler.
    return {
        status: 302,
        headers: {
            Location: redirectUrl,
        },
    };
};

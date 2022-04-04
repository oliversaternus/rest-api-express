export type TemplateKeys = 'ACCOUNT_VERIFICATION' | 'RESET_PASSWORD';

export type TemplateProps = {
    ACCOUNT_VERIFICATION: {
        user: string;
        company: string;
        verificationLink: string;
    },
    RESET_PASSWORD: {
        user: string;
        verificationLink: string;
    }
}
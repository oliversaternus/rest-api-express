export type TemplateKeys = 'ACCOUNT_VERIFICATION' | 'RESET_PASSWORD';

export type TemplateProps = {
    ACCOUNT_VERIFICATION: {
        user: string;
        verificationLink: string;
        senderUrl: string;
        senderCompanyAddress: string;
    },
    RESET_PASSWORD: {
        user: string;
        verificationLink: string;
    }
}
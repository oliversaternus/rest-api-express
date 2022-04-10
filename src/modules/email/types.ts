export type TemplateKeys = 'ACCOUNT_VERIFICATION' | 'RESET_PASSWORD';

export type TemplateProps = {
    ACCOUNT_VERIFICATION: {
        title: string;
        user: string;
        verificationLink: string;
        senderUrl: string;
        senderCompanyAddress: string;
        senderCompanyName: string;
    },
    RESET_PASSWORD: {
        title: string;
        user: string;
        verificationLink: string;
        senderUrl: string;
        senderCompanyAddress: string;
        senderCompanyName: string;
    }
}
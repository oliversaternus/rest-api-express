export type TemplateKeys = 'STANDARD_LETTER' | 'QR_CODE_GRID';

export type TemplateProps = {
    STANDARD_LETTER: {
        title: string;
        senderName: string;
        recipientName: string;
        recipientAddress: {
            country?: string;
            city: string;
            zipCode: string;
            street: string;
        };
        senderAddress: {
            country?: string;
            city: string;
            zipCode: string;
            street: string;
        };
        html_content: string;
    };
    QR_CODE_GRID: {
        title: string;
        codes: Array<{
            title: string;
            qrcode_payload: string;
        }>
    }
}
export type TemplateKeys = 'STANDARD_LETTER';

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
    }
}
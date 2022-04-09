export type TemplateKeys = 'STANDARD_LETTER';

export type TemplateProps = {
    STANDARD_LETTER: {
        recipient: string;
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
        date: string;
        html_Content: string;
    }
}
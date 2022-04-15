import { start, stop } from '../../app';
import { Server } from 'http';
import { DocumentGeneratorService, init, close } from './service';
import { FileService } from '../files/service';

let server: Server;

beforeAll(async () => {
    jest.setTimeout(30 * 1000);
    const state = await start();
    server = state.server;
    await init();
});

afterAll(async () => {
    await close();
    await stop(server);
});

describe('test document generation', () => {
    test('create PDF file', async () => {
        const file = await DocumentGeneratorService.generatePDF('STANDARD_LETTER', {
            title: 'Lorem Ipsum',
            senderName: 'John Doe',
            senderAddress: {
                country: 'USA',
                city: 'Footown',
                zipCode: '1234',
                street: 'Barstreet 123'
            },
            recipientName: 'Max Muster',
            recipientAddress: {
                country: 'Germany',
                city: 'Musterstadt',
                zipCode: '1234',
                street: 'Musterstraße 123'
            },
            html_content: `Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor 
            invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
            <br/>
            <br/>
            At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, 
            no sea takimata sanctus est Lorem ipsum dolor sit amet.
            <br/>
            <br/>
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor 
            invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
            <br/>
            At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
            no sea takimata sanctus est Lorem ipsum dolor sit amet.`
        }, 1);

        expect(file).toBeTruthy();

        if (file) {
            await FileService.deleteFile(file.id);
        }
    }, 30 * 10000);

    test('create QR codes file', async () => {
        const file = await DocumentGeneratorService.generatePDF('QR_CODE_GRID', {
            title: 'Lorem Ipsum',
            codes: [
                {
                    title: '123-4567',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum'
                },
                {
                    title: '234-5678',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+2'
                },
                {
                    title: '456-7890',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+3'
                },
                {
                    title: '678-90123',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+4'
                },
                {
                    title: '432-10987',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+5'
                },
                {
                    title: '789-12345',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+6'
                },
                {
                    title: '567-7890',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+7'
                },
                {
                    title: '890-1234',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+8'
                },
                {
                    title: '901-2345',
                    qrcode_payload: 'https://google.com?q=Lorem+Ipsum+9'
                }
            ]
        }, 1);

        expect(file).toBeTruthy();

        if (file) {
            await FileService.deleteFile(file.id);
        }
    }, 30 * 10000);
});
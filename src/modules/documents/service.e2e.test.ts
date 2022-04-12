import { start, stop } from '../../app';
import { Server } from 'http';
import { DocumentGeneratorService, init, close } from './service';

let server: Server;

beforeAll(async () => {
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
            title: 'Lore Ipsum',
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
            html_content: `
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor 
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

        console.log({ file });

        expect(file).toBeTruthy();

        // await FileService.deleteFile(file.id);

    }, 30 * 10000);
});
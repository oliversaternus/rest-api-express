import { start, stop } from '../../app';
import { Server } from 'http';
import { APIClient } from '../../tools/apiClient';
import { LoginResponse } from '../authentication/types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { File } from './types';
import fetch from 'node-fetch';

let server: Server;
let client: APIClient;

beforeAll(async () => {
    const state = await start();
    server = state.server;
    client = new APIClient(state.baseUrl);
});

afterAll(async () => {
    await stop(server);
});

describe('test files', () => {
    test('create and delete file', async () => {
        const loginResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'admin@test.com',
            password: '123456'
        });

        client.authToken = String(loginResponse.data?.token);
        client.refreshToken = String(loginResponse.data?.refreshToken);

        const imageBuffer = readFileSync(join(__dirname, '..', '..', '..', 'assets', 'banana.jpg'));
        const createResponse = await client.upload<File>('POST', '/files', imageBuffer, 'banana', 'image/jpeg',
            {
                description: 'sweet and tasty',
                caption: 'Yellow bananas'
            });

        expect(createResponse.status).toBe(200);
        expect(createResponse.data?.caption).toBe('Yellow bananas');
        expect(createResponse.data?.description).toBe('sweet and tasty');
        expect(createResponse.data?.url).toBeTruthy();

        const downloadResponse = await fetch(String(createResponse.data?.url));
        expect(downloadResponse.status).toEqual(200);

        const downloadedBuffer = await downloadResponse.buffer();
        expect(downloadedBuffer.byteLength).toEqual(createResponse.data?.size);

        const deleteResponse = await client.invokeApi('DELETE', `/files/${createResponse.data?.id}`);
        expect(deleteResponse.status).toBe(200);

        const downloadDeletedResponse = await fetch(String(createResponse.data?.url));
        expect(downloadDeletedResponse.status).not.toBe(200);
    });
});
import { start, stop } from '../../app';
import { Server } from 'http';
import { APIClient } from '../../tools/apiClient';
import { LoginResponse } from '../authentication/types';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    test('create a file', async () => {
        const loginResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'admin@test.com',
            password: '123456'
        });

        client.authToken = String(loginResponse.data?.token);
        client.refreshToken = String(loginResponse.data?.refreshToken);

        const imageBuffer = readFileSync(join(__dirname, '..', '..', '..', 'assets', 'banana.jpg'));
        const createResponse = await client.upload('POST', '/files', imageBuffer, 'banana', 'image/jpeg',
            {
                description: 'sweet and tasty',
                caption: 'Yellow bananas'
            });

        expect(createResponse.status).toBe(200);
    });
});
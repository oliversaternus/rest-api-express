import { start, stop } from '../../app';
import { Server } from 'http';
import { APIClient } from '../../tools/apiClient';

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

describe('test authentication', () => {
    test('wrong password', async () => {
        const response = await client.invokeApi('POST', '/authentication/login', {
            username: 'admin@test.com',
            password: 'abcdefg'
        })
        expect(response?.status).toBe(401);
    });
});
import { start, stop } from '../../app';
import { Server } from 'http';
import { APIClient } from '../../tools/apiClient';
import { LoginResponse } from '../authentication/types';
import { User } from './types';

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

describe('test users', () => {
    test('GET current user', async () => {

        // LOGIN
        const loginResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'johndoe@test.com',
            password: '123456'
        }, undefined, false);

        client.authToken = String(loginResponse.data?.token);
        client.refreshToken = String(loginResponse.data?.refreshToken);

        const currentUserResponse = await client.invokeApi<User>('GET', '/users/me');

        expect(currentUserResponse.status).toBe(200);
        expect(currentUserResponse.data?.email).toBe('johndoe@test.com');
    });
});
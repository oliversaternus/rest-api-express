import { start, stop } from '../../app';
import { Server } from 'http';
import { APIClient } from '../../tools/apiClient';
import { LoginResponse, LogoutResponse } from './types';

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
        const response = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'admin@test.com',
            password: 'abcdefg'
        })
        expect(response?.status).toBe(401);
    });

    test('successfull login', async () => {
        const response = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'admin@test.com',
            password: '123456'
        })
        expect(response?.status).toBe(200);
        expect(response.data?.token).toBeTruthy();
        expect(response.data?.refreshToken).toBeTruthy();
    });

    test('unauthenticated logout', async () => {
        const response = await client.invokeApi<LogoutResponse>('POST', '/authentication/logout')
        expect(response?.status).toBe(401);
    });

    test('invalid token logout', async () => {
        const response = await client.invokeApi<LogoutResponse>('POST', '/authentication/logout', {
            refreshToken: 'abcdefg'
        })
        expect(response?.status).toBe(403);
    });

    test('login logout and refresh', async () => {
        const loginResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'admin@test.com',
            password: '123456'
        })
        expect(loginResponse?.status).toBe(200);
        expect(loginResponse.data?.token).toBeTruthy();
        expect(loginResponse.data?.refreshToken).toBeTruthy();

        client.authToken = String(loginResponse.data?.token);
        client.refreshToken = String(loginResponse.data?.refreshToken);

        const logoutResponse = await client.invokeApi<LogoutResponse>('POST', '/authentication/logout', {
            refreshToken: client.refreshToken
        });

        expect(logoutResponse?.status).toBe(200);

        const refreshResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/refresh', {
            refreshToken: client.refreshToken
        });

        expect(refreshResponse.status).toBe(403);
    });
});
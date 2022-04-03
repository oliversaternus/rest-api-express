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
    test('CRUD file', async () => {

        // LOGIN
        const loginResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'johndoe@test.com',
            password: '123456'
        }, undefined, false);

        client.authToken = String(loginResponse.data?.token);
        client.refreshToken = String(loginResponse.data?.refreshToken);

        // CREATE
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

        // READ
        const readResponse = await client.invokeApi<File>('GET', `/files/${createResponse.data?.id}`);

        expect(readResponse.status).toBe(200);
        expect(readResponse.data?.caption).toBe('Yellow bananas');
        expect(readResponse.data?.description).toBe('sweet and tasty');
        expect(readResponse.data?.url).toBeTruthy();

        const downloadResponse = await fetch(String(readResponse.data?.url));
        expect(downloadResponse.status).toEqual(200);

        const downloadedBuffer = await downloadResponse.buffer();
        expect(downloadedBuffer.byteLength).toEqual(readResponse.data?.size);

        // UPDATE
        const updateResponse = await client.invokeApi<File>('PUT', `/files/${createResponse.data?.id}`, {
            description: 'very tasty',
            caption: 'Bananas'
        });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.data?.caption).toBe('Bananas');
        expect(updateResponse.data?.description).toBe('very tasty');

        // DELETE
        const deleteResponse = await client.invokeApi('DELETE', `/files/${createResponse.data?.id}`);
        expect(deleteResponse.status).toBe(200);

        const downloadDeletedResponse = await fetch(String(createResponse.data?.url));
        expect(downloadDeletedResponse.status).not.toBe(200);
    });

    test('Query files', async () => {

        // LOGIN
        const loginResponse = await client.invokeApi<LoginResponse>('POST', '/authentication/login', {
            username: 'johndoe@test.com',
            password: '123456'
        }, undefined, false);

        client.authToken = String(loginResponse.data?.token);
        client.refreshToken = String(loginResponse.data?.refreshToken);

        // Query files
        const firstQueryResponse = await client.invokeApi<{ items: File[] }>('GET', '/files', undefined, {
            where: {
                caption: {
                    contains: 'bananas'
                }
            },
            orderBy: {
                caption: 'desc'
            }
        });

        expect(firstQueryResponse.status).toBe(200);
        expect(firstQueryResponse.data?.items.length).toBe(3);
        expect(firstQueryResponse.data?.items[0].caption).toBe('3 bananas');
        expect(firstQueryResponse.data?.items[1].caption).toBe('2 bananas');
        expect(firstQueryResponse.data?.items[2].caption).toBe('1 yellow bananas');
    });
});
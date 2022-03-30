import fetch from 'node-fetch';
import FormData from 'form-data';
import { stringify } from 'qs';

export class APIClient {
    authToken = '';
    refreshToken = '';
    baseUrl = '';

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    invokeApi = async <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any, query?: any, auth?: boolean) => {
        let data: T | undefined;
        let status: number | undefined;
        try {
            const headers = {
                'content-type': 'application/json',
                ...(auth && this.authToken && { authorization: this.authToken }),
                ...(body instanceof FormData && { ...body.getHeaders() })
            };

            const response = await fetch(this.baseUrl + path + (query ? stringify(query, { addQueryPrefix: true }) : ''), {
                method,
                headers,
                body: body && (body instanceof FormData ? body : JSON.stringify(body))
            });

            status = response.status;
            if (response.ok) {
                data = await response.json() as T;
            }
            return { status, data }
        } catch (e) {
            return { status, data };
        }
    };

    upload = async <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, file: Buffer, name: string, contentType: string, info?: any) => {
        const formdata = new FormData();
        formdata.append('data', file, {
            filename: name,
            contentType
        });
        if (info) {
            formdata.append('info', JSON.stringify(info));
        }
        const response = await this.invokeApi<T>(method, path, formdata, undefined, true);
        return response;
    };
}
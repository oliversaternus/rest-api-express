import express from 'express';
import strongErrorHandler from 'strong-error-handler';
import cors from "cors";
import { json, urlencoded } from 'body-parser';
import { createServer, Server } from 'http';
import fileUpload from 'express-fileupload';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import 'dotenv/config';

import { authenticationRouterFactory } from './modules/authentication/controller';
import { fileRouterFactory } from './modules/files/controller';
import { userRouterFactory } from './modules/users/controller';

// define constants
const testEnvironment = process.env.NODE_ENV === 'test';
const port = process.env.PORT || (testEnvironment ? 5050 : 5000);
const tempPath = join(__dirname, '..', 'tmp');

// setup temp path for file upload
if (!existsSync(tempPath)) {
    mkdirSync(tempPath);
}

// set up server app
export const app = express();
app.use(json());
app.use(cors());

app.use("/files", urlencoded({ extended: true, limit: '50mb' }));
app.use("/files", fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: tempPath
}));

app.use("/authentication", authenticationRouterFactory());
app.use("/users", userRouterFactory());
app.use("/files", fileRouterFactory());

app.use(strongErrorHandler({
    debug: false,
    log: false
}));

// promise based function to start server
function listen(): Promise<Server> {

    return new Promise((resolve) => {
        const server = createServer(app);
        server.listen(port, () => {
            console.log(`Server listen on port ${port}`);
            return resolve(server);
        });

        server.on('error', (e) => {
            console.log(e);
            server.close();
        });
    });
}

// export function to start server
export const start = async () => {
    const server = await listen();

    return { server, baseUrl: `http://localhost:${port}` };
}

// export function to stop server
export const stop = (server: Server): Promise<void> => {
    return new Promise((resolve) => {
        server.close(() => {
            return resolve();
        });
    });
}

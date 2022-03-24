import * as express from 'express';
import * as strongErrorHandler from 'strong-error-handler';
import * as cors from "cors";
import { json } from 'body-parser';
import { createServer, Server } from 'http';

import { authenticationRouterFactory } from './modules/authentication/controller';

// define constants
const testEnvironment = process.env.NODE_ENV === 'test';
const port = process.env.PORT || (testEnvironment ? 5050 : 5000);

// set up server app
export const app = express();
app.use(json());
app.use(cors());

app.use("/authentication", authenticationRouterFactory());

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

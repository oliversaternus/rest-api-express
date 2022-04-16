# rest-api-express
a showcase rest api with nodeJS, express, prisma...

This is a good starter project for creating a new rest-api. The features that can be reused or adjusted includes:

- JWT authentication
- CRUD actions
- S3 file upload
- Websocket messaging
- Jest end to end tests
- sending emails using HTML templates
- generating PDF documents using HTML templates

Different functionalities are encapsulated into seperate modules in the `src/modules` folder.

# Setup

## Before you get started

The recommended evironment is a Ubuntu VPS server.
This guide goes through all necessary steps to set it up on a fresh Ubuntu 18.04 instance.

Create a dedicated sudo user and login as such, before you start.
Doing the setup as `root` user might block you later, e.g. from using `Puppeteer` in a sandbox.

```bash
#!/bin/bash
# create new user
adduser webmaster
# add user to sudo group
usermod -aG sudo webmaster
# Login with the new account before you follow up
```

To install all necessary programms on a brand new server instance, run the following bash code:

```bash
#!/bin/bash
# install binaries
sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y install ufw
sudo apt-get -y install libssl-dev
sudo apt -y install certbot
sudo apt -y install git-all
sudo apt -y install nginx
sudo apt-get install python-software-properties
sudo curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash
sudo apt-get -y install nodejs
sudo apt-get -y install jq
sudo node -v
sudo npm -v
# setup pm2 with weboscket
sudo npm install -g @socket.io/pm2
echo "pm2 installed"
sudo pm2 startup
echo "pm2 startup configured"
# setup firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
echo "firewall rules set"
sudo ufw enable
echo "firewall setup finished"
```

- For a standalone project you will also need to create a domain and point them to the server IP with a A-Record.
- To enable the server to send emails programatically you have to create an Email address and get the SMTP credentials that you will need to add in the environment file later.
- For a clean setup you should always create a new Github user and make him the collaborator of the repositories that you want to clone on the server. That way you can avoid security risks and allow contiuous deployment.

## Getting started

Clone the project, preferrably into your `HOME` folder

```bash
#!/bin/bash
cd
git clone PROJECT_REPOSITORY_URL
```

### Initial Configuration

Follow these steps to configure the project accordingly to your setup:

1. Install dependencies: 
```bash
#!/bin/bash
cd PROJECT_NAME
npm i
```
2. Create an environment file. It must be named `.env` and located in the project root folder. This file defines some important global variables for the application. You can use the example.env file as a reference.  It contains all keys that are used in the application. If you adjust the project and not use certain functionality (like Email or S3), you can leave out those keys in the environment file:
```
BASE_SECRET={random 32 character hex string}
S3_BUCKET={bucket name}
S3_ENDPOINT={url of S3 instance}
S3_ACCESS_KEY=XXXXXXXXXX
S3_SECRET_KEY=XXXXXXXXXXX
S3_REGION={region}
S3_FORCE_PATH_STYLE={boolean}
S3_PUBLIC_BUCKET_ADDRESS={public address to download a file from a bucket}
SMTP_HOST={smtp host}
SMTP_PORT={smtp port}
SMTP_USER={smtp username}
SMTP_PASSWORD={smtp password}
SMTP_EMAIL_ADDRESS={smtp email address if differs from user}
```
**Note: If you run end to end tests, you also need a seperate `dev.env` file that will be used only for tests.**

3. Create a environment file for the prisma client. It must be named `.env` and located in the prisma folder `PROJECT_NAME/prisma`. This file defines the database-URL that the application connects to. The project default is to use Sqlite as the main database. You can use the `example.env` file as a reference.

4. Adjust the `seed.ts` file in the prisma folder. It will fill the database with the initial data once it is created.

5. Run initial migration.

6. Build the project for production.
```bash
#!/bin/bash
cd PROJECT_NAME
npm run build
```

7. Create a PM2 config (`pm2.json`) in the project root folder. This will be used by PM2 internally to identify the process. You can specify cluster mode options and more. [PM2 Docs](https://pm2.keymetrics.io/docs/usage/application-declaration)

pm2.json:
```js
{
    "apps": [
        {
            "name": "app-name",
            "script": "dist/server.js",
            "instances": "max",
            "exec_mode": "cluster",
            "env": {
              "NODE_ENV": "production"
            }
        }
    ]
}
```

### Deployment
Follow these steps to get the project up and running.

1. Retrieve SSL certificates. Replace `example.com` with your frontend URL and `api.example.com` with your backend URL.
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d example.com -d api.example.com
```

2. Setup NGINX as a reverse proxy. Add a new NGINX config file `/etc/nginx/PROJECT_NAME.conf`. Replace PROJECT_NAME with the name of the project. You can use this template for the config file. Replace the terms in curly braces with the respective values:
```
server {
	listen 443;
	server_name {application_url};

    client_max_body_size 500M;
		
	gzip 				on;
	gzip_types      	text/css text/javascript text/xml text/plain text/x-component application/javascript application/json application/xml application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
	gzip_proxied    	no-cache no-store private expired auth;
	gzip_http_version 	1.0;
	gzip_min_length 	1000;
	gzip_disable        "MSIE [1-6]\.";
	gzip_vary           on;
	gunzip 				on;
	ssl_certificate           {certificate_path}/fullchain.pem;
	ssl_certificate_key       {certificate_path}/privkey.pem;
	ssl on;
	ssl_session_cache  builtin:1000  shared:SSL:10m;
	ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
	ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
	ssl_prefer_server_ciphers on;
	access_log            /var/log/nginx/{application_url};
	location / {
		proxy_set_header        Host $host;
		proxy_set_header        X-Real-IP $remote_addr;
		proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header        X-Forwarded-Proto $scheme;
		proxy_set_header 		Upgrade $http_upgrade;
        proxy_set_header 		Connection $connection_upgrade;
	
		proxy_pass_request_headers on;
		proxy_pass          http://localhost:{application_port};
		proxy_read_timeout  90;
		proxy_redirect      http://localhost:{application_port}/ https://$host/;
	}
}
```

Import this file in the default NGINX config located at `/etc/nginx/sites-available/default` by adding the following code line. Replace `PROJECT_NAME` with the name of the project:
```
include    /etc/nginx/PROJECT_NAME.conf;
```

If not already present (e.g. for a brand new server), also add the following code above the `include` statement and remove all other code from the default NGINX config:
```
server {
	listen 80;
	return 301 https://$host$request_uri;
}
map $http_upgrade $connection_upgrade {
	default upgrade;
	'' close;
}
```

3. Start project.
```bash
#!/bin/bash
cd "PROJECT_NAME"
sudo pm2 start pm2.json
echo "frontend started"
sudo pm2 save
echo "pm2 saved process list"
```

4. Restart NGINX to apply all changes. After that you should be live on the web!

```bash
#!/bin/bash
sudo systemctl restart nginx
```

## Advanced

### Certificate Autorenewal

Create a cronjob to make sure the certificates are always up to date if there is not already one in place.

Certbot automatically creates a cronjob to renew your certificates, but it does not consider NGINX reverse-proxy.
So it needs to be deleted and replaced with a custom cronjob:

```bash
#!/bin/bash
sudo rm /etc/cron.d/certbot
```

To create the custom cronjob, open the root crontab editor with command `sudo crontab -e` and add the line `0 3 * * 0 certbot renew --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"`.

With this setup your page will be unavailible while the certificates are renewed. That can be up to a few seconds.

### Continuous Deployment

To enable continuous deployment, you need to make sure the git credentials are stored on the system and do not change.

Add `deploy.sh` to `.gitignore` file. Then create a deployment script in the project root folder and name it `deploy.sh`. Here is one example. Replace `PROJECT_NAME` and `PM2_ALIAS` with your project name and the name you defined in `pm2.json` file.

```bash
#!/bin/bash
git add *
git stash
echo "stashed local changes"
git checkout main
git fetch
UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")
if [ $LOCAL = $REMOTE ]; then
    echo "Skipping build."
elif [ $LOCAL = $BASE ]; then
    echo "Pulling from remote"
    git pull
    echo "Pulling successfull"
    npm install
    echo "installed dependencies"
    npm run build
    echo "project built"
    pm2 restart PM2_ALIAS
else
    echo "Skipping build."
fi
echo "done"
```

Add it to crontab by executing the following snippet:

```bash
#!/bin/bash
(crontab -l ; echo "10 3 1 * * deploy.sh") | crontab -
```

### Upload Size

If the maximum file size does not fit your needs, adjust the NGINX config and also the option for express-fileupload in `src/app.ts`.

### Domain Change
If you want to change the domain, you need to get new certificates with `certbot` and to change configurations for NGINX.
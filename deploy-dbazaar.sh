#!/bin/sh
# shellcheck disable=SC1017
echo "Jump to app folder"
cd /var/www/b247-backend || exit

echo "Switch to stage branch"
git checkout dbazaar

echo "Update app from Git"
git pull

echo "Install app dependencies"
sudo npm install

#echo "Build your app"
#sudo npm run build

echo "Restarting PM2 "
pm2 reload core-api --time
pm2 ls
echo "--All Done --"

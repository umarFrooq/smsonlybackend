echo "Jump to app folder"
cd /var/www/b247-backend

#echo "Switch to master branch"
#git checkout master

echo "Update app from Git"
git pull

echo "Install app dependencies"
sudo npm install

#echo "Build your app"
#sudo npm run build

echo "Restart PM2 "
pm2 reload server.js -i max --name backend-api --time

echo "-- All Done --"

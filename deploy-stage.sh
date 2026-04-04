echo "Jump to app folder"
cd /var/www/b247-backend

echo "Switch to stage branch"
git checkout stage

echo "Update app from Git"
git pull

echo "Install app dependencies"
sudo npm install

#echo "Build your app"
#sudo npm run build

echo "Restart PM2 "
pm2 reload 0 --time

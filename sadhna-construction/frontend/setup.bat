@echo off
echo Setting up Tailwind CSS and installing dependencies...

echo Installing npm dependencies...
call npm install
call npm install -D tailwindcss@3.3.2 postcss@8.4.23 autoprefixer@10.4.14

echo Setting up Tailwind CSS...
call node setup-tailwind.js

echo Setup complete! Please run "npm start" to start the development server.
pause 
Firts, you'll need to make sure you've got Node and npm (Node Package Manager) installed.
- To check this, run `node -v` and `npm -v` in your terminal / command line.
- If it is not installed, install - https://nodejs.org/en/download
- Node and npm are bundled together, so once Node is installed you can proceed.
- Make sure you're in the frontend directory and run: `npm install --legacy-peer-deps`
  (the `--legacy-peer-deps` is neccessary since there is a little mismatch between version of compatible dependencies, but everything is working regardless of that).
- Finally, to run the frontend run the command `npm run web`. If your running with backend make sure that the backend fully running before executing this command.

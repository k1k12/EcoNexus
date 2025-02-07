# Welcome 👋

**How to setup:**
- Clone the repo.
- Open the README file in the backend directory.
- Follow the instructions there to setup the backend.
- Once backend is set up, go to the frontend directory and follow instruction in the README file there.
- When both backend and frontend are ready, you can proceed.

Now, before starting the frontend, we need to start the backend. 
- In the terminal where you've sourced into the python virtual environment, make sure you're in the backend directory and run: `python main.py`.
- You should see flask started.

Finally, we can run the frontend!
- In a new command line window go to the frontend directory and run: `npm run web`

Your browser should automatically open up and start loading the web page (it may take a minute the first time you launch it).

# Gitignore

We have a .gitignore where all common excludes are mentioned. These excludes should stay there, so do not delete them, or you will trash the repo with tons of files which shouldn't be pushed here. It will be better if you don't touch the .gitignore at all. And yes, the .idea folder is not excluded by default since in reality not all developers use the same IDE, and if every developer would add their excludes in a single shared file, it would become a mess very quickly.

### Your local .gitignore
It is a better approach to exclude your .idea and similar folders, specific to your development environment in your local .gitignore (the file actually is not called .gitignore but it's purpose is the same). The file is located in the .git directory (you need to show hidden files if it's not visible) at .git/info/exclude

Syntax is exactly the same as in .gitignore, the only difference is that this file is not being pushed to the repo, it's your local gitignore which is the best place to specify excludes which are not common across the team. 
So go ahead and exclude the .idea and/or similar folders using this file! 

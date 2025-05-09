# Welcome 👋

**How to setup:**
- Clone the repo.
- Open the README file in the backend directory.
- Follow the instructions there to setup the backend.
- Once backend is set up, go to the frontend directory and follow instruction in the README file there.
- When both backend and frontend are ready, you can proceed.

Now, before starting the frontend, we need to start the backend. 
- In the terminal where you've sourced into the python virtual environment, make sure you're in the backend directory and run: `python3 -m pip install -r requirements.txt`
- Once requirements installed, run: `uvicorn main:app --reload`

Finally, we can run the frontend!
- In a new command line window go to the frontend directory and run: `npm run web`

Your browser should automatically open up and start loading the web page (it may take a minute the first time you launch it).

## Dev branch!

Hello everyone - not sure how many are familiar with dev->main best practice but thought it was nice to write about it here just in case (I also cannot sleep)

It is my understanding that our main branch should always be kept in a working state - no comp. errors, bugs or anything like that. So for any new features (e.g. for backend, consider creating auth endpoints PR), a new feature branch should be made (e.g. feature/auth-endpoints) that pulls from dev then, when done, pushes to dev. Once dev is working, a PR should be made to push to main that is subject to approval.

If one of us would like to volunteer, I believe there is a way to set an approval admin up that, you guessed it, approves the PR's to main to make sure there is no conflict.

## Please read the following section about the .gitignore and exclude any folders which shouldn't be pushed to the repo. 

# Gitignore

We have a .gitignore where all common excludes are mentioned. These excludes should stay there, so do not delete them, or you will trash the repo with tons of files which shouldn't be pushed here. It will be better if you don't touch the .gitignore at all. And yes, the .idea folder is not excluded by default since in reality not all developers use the same IDE, and if every developer would add their excludes in a single shared file, it would become a mess very quickly.

### Your local .gitignore
It is a better approach to exclude your .idea and similar folders, specific to your development environment in your local .gitignore (the file actually is not called .gitignore but it's purpose is the same). The file is located in the .git directory (you need to show hidden files if it's not visible) at .git/info/exclude

Syntax is exactly the same as in .gitignore, the only difference is that this file is not being pushed to the repo, it's your local gitignore which is the best place to specify excludes which are not common across the team. 
So go ahead and exclude the .idea and/or similar folders using this file! 

### Mapping Criteria 

As part of our code submission, the table below must be populated. Relevant file paths, links, or explanations for where each criteria is addressed in the codebase is required. Be specific, referencing filenames, directories, or documentation sections. If the test is used broadly across multiple files and cannot be referenced state that. If there are related documents (e.g., a description of agreed code standards or style configuration files), those should be included in this table.

| **Criteria** | **Where to Find It (File Paths, Links, or Explanations)** |
|--------------|--------------------------------------------------------------------------------|
| **Team Standards: Cohesion**                 | Github, Discord, Miro, Nuclino, Figma          |
| **Team Standards: Documentation**            | README in codebase and in Github repo          |
| **Team Standards: Version Control Workflow** | Github                                         |
| **Design & Structure**                       | Figma                                          |
| **GUI: Clever and Interesting Design**       | Figma                                          |
| **Testing Documentation**                    | Testing Documentation with attached appendix   |
| **Functionality and Features**               | In the code base                               |

### Links for Mapping Criteria
Figma - [Link Here](https://www.figma.com/design/ZknBn6xfqHXtRACVskTSyf/Main-design?node-id=0-1&m=dev)

Miro - [Link Here](https://miro.com/welcomeonboard/cHF2NCtFVzRaR0plaHlVUVFEYldKaTZYWFJjNGlSc0lYWWFkbmx5bEVrNVNwaXNkbWhmTFp5Z2d4bDY5QUxaN1Z4ZnA4T0RIL1A1Z0FpQ2NkN2NjT09zUW1HN0tvVkFSSEx5aTF6Q1NyTWFyZTFzVzVMUzJaQXE4OGZZZXNmalp3VHhHVHd5UWtSM1BidUtUYmxycDRnPT0hdjE=?share_link_id=756834473119)

Nuclino - [Link Here](https://join.nuclino.com/EcoNexus?link=oE4RT_-PC3XQZKZaBG9Pbc)

Github - [Link Here]( https://github.com/newcastleuniversity-computing/CSC2033_Team30_24-25)

### README Links
Backend - [Link Here](backend/README.md)

Frontend - [Link Here](frontend/README.md)



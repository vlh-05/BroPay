# BroPay Project Setup

## Day 1 - 27 March 2025

Create a Github repository and clone it to the local system. Add frontend, backend and docs folder to the both remote and local system.

## Git commands

### 1. Initialize a new Git repo locally
git init

### 2. Link it to your GitHub origin (replace <username> and <repo> accordingly)
git remote add origin https://github.com/<username>/BroPay.git

### 3. Scaffold your docs, backend, frontend folders and an initial ProjectSetup.md
mkdir -p docs
mkdir backend
mkdir frontend

### 4. Stage all your files (code + docs)
git add .

### 5. Commit with a clear, concise message
git commit -m "chore: init repo & docs scaffold"

### 6. Ensure your primary branch is named 'main'
git branch -M main

### 7. Push everything up to GitHub and set upstream tracking
git push -u origin main

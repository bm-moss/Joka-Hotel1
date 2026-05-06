@echo off
SET GIT=C:\Users\lenovo\Downloads\PortableGit\bin\git.exe

echo === Step 1: Configure Git ===
%GIT% config --global user.name "bm-moss"
%GIT% config --global user.email "bm-moss@users.noreply.github.com"
%GIT% config --global credential.helper manager

echo === Step 2: Init repo ===
%GIT% init
%GIT% branch -M main

echo === Step 3: Add files ===
%GIT% add .
%GIT% status

echo === Step 4: Commit ===
%GIT% commit -m "Joka Hotel Management System - initial deploy"

echo === Step 5: Add remote ===
%GIT% remote remove origin 2>nul
%GIT% remote add origin https://github.com/bm-moss/Joka-Hotel1.git

echo === Step 6: Push ===
%GIT% push -u origin main

echo === DONE ===
pause

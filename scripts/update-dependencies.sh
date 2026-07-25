#!/bin/bash

cd $(dirname "$0")
cd ..

command_exists(){
  command -v "$1" &> /dev/null
}

if ! command_exists "ncu"; then
    echo "npm-check-updates is not installed"
    npm i -g npm-check-updates
else
    echo "ncu is installed"
fi

function updateDependencies {
  echo "updating dependencies..."
  ncu -u -x @types/node -x electron -x @babel/preset-typescript -x typescript
}

updateDependencies &&
cd packages/main-process && updateDependencies && cd ../.. &&
cd packages/build        && updateDependencies && cd ../.. &&
npm install              &&

echo "Great Success!"

sleep 2

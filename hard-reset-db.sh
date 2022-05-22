#!/bin/bash

# rm -rf node_modules
# rm package-lock.json
# npm i 


npm run db:drop
npm run db:create
npm run db:migrate

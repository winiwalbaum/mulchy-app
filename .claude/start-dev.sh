#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/winiwalbaum/Downloads/huertacora-main
exec /opt/homebrew/bin/node node_modules/.bin/vite --port 5173

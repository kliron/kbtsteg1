run: ; ./scripts/run.sh

deps: ; ./scripts/deps.sh

buildjs: ; (cd ./client && npm run build)

build: ; ./scripts/build.sh

buildwin32: ; ./scripts/build_win32.sh

buildwin64: ; ./scripts/build_win64.sh

#!/usr/bin/env bash

GOOS=windows
GOARCH=386
GITHUB=github.com/kliron/kbtsteg1/kbtsteg1/kbtsteg1
binary=${GOPATH}/pkg/${GOOS}_${GOARCH}/${GITHUB}.exe
main=${GOPATH}/src/${GITHUB}/main.go
echo "Building for ${GOOS}, ${GOARCH}."
echo "Executable will be saved at: ${binary}"
go build -o ${binary} ${main}

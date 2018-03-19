#!/usr/bin/env bash

GOOS=darwin
GOARCH=amd64
GITHUB=github.com/kliron/kbtsteg1/kbtsteg1/kbtsteg1
binary=${GOPATH}/pkg/${GOOS}_${GOARCH}/${GITHUB}
main=${GOPATH}/src/${GITHUB}/main.go
echo "Building for ${GOOS}, ${GOARCH}."
echo "Executable will be saved at: ${binary}"
go build -o ${binary} ${main}

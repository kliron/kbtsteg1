package main

import (
	"net/http"
	"log"
	. "github.com/kliron/kbtsteg1/kbtsteg1"
)


func main() {
	http.HandleFunc("/api/users", UserActionHandler)
	http.HandleFunc("/api/departments", DepartmentsActionHandler)
	http.Handle("/", http.FileServer(http.Dir(*WebRoot)))
	log.Printf("Server listening on http://localhost:%s", *Port)
	log.Fatal(http.ListenAndServe(":" + *Port, nil))
}
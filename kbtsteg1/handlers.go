package kbtsteg1

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func JsonError(w http.ResponseWriter, err error) {
	JsonResponse(w, map[string]interface{}{"error": true, "data": err.Error()})
}

func JsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Strict-Transport-Security", "max-age=31536000")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func UserActionHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		GetUsersHandler(w, r)
	case "POST":
		PostUserHandler(w, r)
	case "DELETE":
		DeleteUserHandler(w, r)
	default:
		w.WriteHeader(405)
		w.Write([]byte("Method not allowed"))
	}
}

func DepartmentsActionHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		GetDepartmentsHandler(w, r)
	case "POST":
		PostDepartmentsHandler(w, r)
	default:
		w.WriteHeader(405)
		w.Write([]byte("Method not allowed"))
	}
}

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	users, err := GetAllUsers()
	if err != nil {
		JsonError(w, err)
		return
	}
	JsonResponse(w, map[string]interface{}{"error": false, "data": users})
}

func PostUserHandler(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var user User
	if err := decoder.Decode(&user); err != nil {
		JsonError(w, err)
		return
	}
	if err := SaveUser(user); err != nil {
		JsonError(w, err)
		return
	}

	if err := NotifyAboutUser(user); err != nil {
		log.Printf("NotifyAboutUser returned error: %s", err)
		JsonError(w, fmt.Errorf("Epost notifiering kunde inte skickas, prova igen sernare."))
	}

	JsonResponse(w, map[string]interface{}{"error": false, "data": "OK"})
}

func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if err := DeleteUser(email); err != nil {
		JsonError(w, err)
		return
	}
	JsonResponse(w, map[string]interface{}{"error": false, "data": "OK"})
}

func GetDepartmentsHandler(w http.ResponseWriter, r *http.Request) {
	depts, err := GetDepartments()
	if err != nil {
		JsonError(w, err)
		return
	}
	JsonResponse(w, map[string]interface{}{"error": false, "data": depts})
}

func PostDepartmentsHandler(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var depts Departments
	if err := decoder.Decode(&depts); err != nil {
		JsonError(w, err)
		return
	}
	if err := SaveDepartments(depts); err != nil {
		JsonError(w, err)
		return
	}
	JsonResponse(w, map[string]interface{}{"error": false, "data": "OK"})
}

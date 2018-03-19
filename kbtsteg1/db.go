package kbtsteg1

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/smtp"
	"strings"
	"time"

	"github.com/boltdb/bolt"
)

var (
	Port    = flag.String("port", "8080", "The port to listen to for HTTP requests.")
	DbFile  = flag.String("cert", "db.bolt", "The Bolt database file to use.")
	WebRoot = flag.String("www", "static", "The web root directory from which static assets are served.")
)

// You can safely share a single *bolt.DB reference between multiple goroutines.
// Each of those should create their own *bolt.Tx. Commit your transactions regularly.
// You can get in a deadlock situation if you try to keep transactions open indefinitely.
// see: https://github.com/boltdb/bolt/issues/255
var db *bolt.DB

const STRING_LIST_SEP = ";"

const USERS_BUCKET = "users"

const DEPARTMENTS_BUCKET = "departments"

const DEPTS_KEY = "depts"

const NOTIFICATIONS_BUCKET = "notifications"

type User struct {
	Email       string `json:"email"`
	Telephone   string `json:"telephone"`
	Name        string `json:"name"`
	Need        string `json:"need"`        // antal patienter som behövs
	Diagnoses   string `json:"diagnoses"`   // önskade diagnoser
	Start       string `json:"start"`       // önskar påbörja (datum)
	Acute       string `json:"acute"`       // akut behov av steg-1 patient ('ja', 'nej')
	Departments string `json:"departments"` // Enheter som användaren vill kontakta: ;-separated list
	Registered  string `json:"registered"`  // datum skapad
}

type DepartmentInfo struct {
	Display string `json:"display"` // department's user friendly name
	Date    string `json:"date"`    // date last updated
	Number  string `json:"number"`  // how many available patients exist
}

type Departments struct {
	UtredningsEnheten     DepartmentInfo `json:"utrednings_enheten"`
	AffektivaProgrammet   DepartmentInfo `json:"affektiva_programmet"`
	InternetPsykiatri     DepartmentInfo `json:"internet_psykiatri"`
	Psykosprogrammet      DepartmentInfo `json:"psykosprogrammet"`
	AffektivaMottagningen DepartmentInfo `json:"affektiva_mottagningen"`
}

// Saves timestamp when a department was notified about a user
// one-to-one correspondence with each user. It is saved in NOTIFICATIONS_BUCKET keyed by the user's email
func makeNotifications() map[string]int64 {
	return map[string]int64{
		AffektivaMottagningen: 0,
		AffektivaProgrammet:   0,
		InternetPsykiatri:     0,
		Psykosprogrammet:      0,
		UtredningsEnheten:     0,
	}
}

const AffektivaMottagningen = "Affektiva mottagningen"
const AffektivaProgrammet = "Afektiva programmet"
const InternetPsykiatri = "Internet psykiatri"
const Psykosprogrammet = "Psykosprogrammet"
const UtredningsEnheten = "Utredningsenheten"

func init() {
	flag.Parse()

	var err error

	db, err = bolt.Open(*DbFile, 0600, &bolt.Options{Timeout: 1 * time.Second})
	Failif(err)

	// Create the users bucket if it does not exist
	err = db.Update(func(tx *bolt.Tx) (err error) {
		_, err = tx.CreateBucketIfNotExists([]byte(USERS_BUCKET))
		return

	})
	Failif(err)

	err = db.Update(func(tx *bolt.Tx) (err error) {
		_, err = tx.CreateBucketIfNotExists([]byte(DEPARTMENTS_BUCKET))
		return
	})
	Failif(err)

	err = db.Update(func(tx *bolt.Tx) (err error) {
		_, err = tx.CreateBucketIfNotExists([]byte(NOTIFICATIONS_BUCKET))
		return
	})
	Failif(err)

	log.Printf("BoltDB: Initialized '%s', '%s' and '%s buckets", USERS_BUCKET, DEPARTMENTS_BUCKET, NOTIFICATIONS_BUCKET)

	// If departments are not initialized, save an empty struct in order to set the department names
	depts, err := GetDepartments()
	Failif(err)
	if depts.AffektivaMottagningen.Display == "" {
		depts.AffektivaMottagningen.Display = AffektivaMottagningen
		depts.AffektivaProgrammet.Display = AffektivaProgrammet
		depts.InternetPsykiatri.Display = InternetPsykiatri
		depts.Psykosprogrammet.Display = Psykosprogrammet
		depts.UtredningsEnheten.Display = UtredningsEnheten

		err = SaveDepartments(depts)
		Failif(err)

		log.Print("BoltDB: Set departments names")
	}

	log.Printf("Mail settings:\nfrom address: %s\nuser: %s\npassword: **********", MailAddress, MailUser)
}

//***************************************** BOLT *************************************************//

func GetAllUsers() (users []User, err error) {
	err = db.View(func(tx *bolt.Tx) (err2 error) {

		bkt := tx.Bucket([]byte(USERS_BUCKET))

		c := bkt.Cursor()

		for k, v := c.First(); k != nil; k, v = c.Next() {

			var user User

			if err2 = json.Unmarshal(v, &user); err2 != nil {
				fmt.Errorf("Error unmarshalling user %s: %s", string(k), err2)
				return
			}

			users = append(users, user)
		}
		return
	})
	if users == nil {
		users = make([]User, 0) // return empty slice instead of nil
	}
	return
}

func SaveUser(user User) (err error) {
	err = db.Update(func(tx *bolt.Tx) (err2 error) {

		bkt := tx.Bucket([]byte(USERS_BUCKET))

		bytes, err2 := json.Marshal(user)
		if err2 != nil {
			return
		}

		err2 = bkt.Put([]byte(user.Email), bytes)

		return
	})
	return
}

func DeleteUser(email string) (err error) {
	err = db.Update(func(tx *bolt.Tx) (err2 error) {

		bkt := tx.Bucket([]byte(USERS_BUCKET))

		err2 = bkt.Delete([]byte(email))

		return
	})
	return
}

func GetDepartments() (depts Departments, err error) {
	err = db.View(func(tx *bolt.Tx) (err2 error) {

		bkt := tx.Bucket([]byte(DEPARTMENTS_BUCKET))

		raw := bkt.Get([]byte(DEPTS_KEY))

		if raw != nil {
			err2 = json.Unmarshal(raw, &depts)
		}

		return
	})
	return
}

func SaveDepartments(depts Departments) (err error) {
	err = db.Update(func(tx *bolt.Tx) (err2 error) {

		bkt := tx.Bucket([]byte(DEPARTMENTS_BUCKET))

		bytes, err2 := json.Marshal(depts)
		if err2 != nil {
			return
		}

		err2 = bkt.Put([]byte(DEPTS_KEY), bytes)

		return
	})
	return
}

func GetNotifications(email string) (notifications map[string]int64, err error) {
	err = db.View(func(tx *bolt.Tx) (err2 error) {
		bkt := tx.Bucket([]byte(NOTIFICATIONS_BUCKET))

		raw := bkt.Get([]byte(email))

		if raw != nil {
			if err2 = json.Unmarshal(raw, &notifications); err2 != nil {
				fmt.Errorf("Error unmarshalling notifications for user %s: %s", string(email), err2)
				return
			}
		} else {
			notifications = makeNotifications()
		}
		return
	})
	return
}

func SaveNotifications(email string, notifications map[string]int64) (err error) {
	err = db.Update(func(tx *bolt.Tx) (err2 error) {

		bkt := tx.Bucket([]byte(NOTIFICATIONS_BUCKET))

		bytes, err2 := json.Marshal(notifications)
		if err2 != nil {
			return
		}

		err2 = bkt.Put([]byte(email), bytes)

		return
	})
	return
}

/***************************************** END BOLT ******************************************/

/****************************************** EMAIL *********************************************/

func Send(user User, to []string) (err error) {
	log.Printf("Sending notifications for %s to: %s", user.Email, strings.Join(to, STRING_LIST_SEP))
	body := fmt.Sprintf("Hej!\n\nNu finns det behov av KBT steg-1 patient för:\n    %s\n    epost: %s\n    tel: %s\n\nSvara inte på denna e-post - kontakta ovanstående personen direkt.", user.Name, user.Email, user.Telephone)
	subject := "Behov av KBT steg-1 patient"
	from := MailFrom
	msg := fmt.Sprintf("From: <%s>\nTo: <%s>\nSubject: %s\n\n%s", from, to, subject, body)
	err = smtp.SendMail("smtp.gmail.com:587",
		smtp.PlainAuth("", MailUser, MailPassword, "smtp.gmail.com"), MailAddress, to, []byte(msg))
	return
}

func NotifyAboutUser(user User) (err error) {
	wantsNotified := strings.Split(user.Departments, STRING_LIST_SEP) // the departments the user said they want notified
	if len(wantsNotified) == 0 {
		return
	}

	notifications, err := GetNotifications(user.Email) // the existing notification status for the user. If non-existing, it will be created here.
	if err != nil {
		return
	}

	var recipients []string

	// Iterate over all departments.
	// If the timestamp is 0 add the department in the list of recipients to be notified.
	// For each notified department, save the current timestamp.
	for _, dep := range wantsNotified {
		if dep == "" { // If the user has not chosen any departments to be notified this will be an empty string
			continue
		}
		// Check if department is already notified
		tmstmp, ok := notifications[dep]
		if !ok {
			return fmt.Errorf("Bug! Unknown department '%s'", dep)
		}
		if tmstmp != 0 {
			log.Printf("Notifications for user %s were already sent for department %s at %s - will not notify", user.Email, dep, time.Unix(tmstmp, 0))
			continue
		}
		depEmail, ok := Recipients[dep]
		if !ok {
			return fmt.Errorf("Bug! Unknown department '%s'", dep)
		}
		recipients = append(recipients, depEmail)
		notifications[dep] = time.Now().Unix()
	}

	if len(recipients) > 0 {
		if err = Send(user, recipients); err != nil {
			return
		}
	}

	// Mail was sent successfully
	err = SaveNotifications(user.Email, notifications)
	return
}

/**************************************** END EMAIL *******************************************/

// Utility functions

func Failif(err error) {
	if err != nil {
		panic(err)
	}
}

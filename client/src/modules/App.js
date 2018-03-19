'use strict';
import 'whatwg-fetch'
import snabbdom from 'snabbdom'
import h from 'snabbdom/h'
import { Navigation, InfoView } from './Views'

const patch = snabbdom.init([
    require('snabbdom/modules/class').default,          // makes it easy to toggle classes
    require('snabbdom/modules/props').default,          // for setting properties on DOM elements
    require('snabbdom/modules/style').default,          // handles styling on elements with support for animations
    require('snabbdom/modules/eventlisteners').default  // attaches event listeners
]);


/***************************************************************
 *                                                             *
 *                            VIEW                             *
 *                                                             *
 ***************************************************************/

let vnode;

const view = () => h('div.clearfix.py1.px3', [
    Navigation(),
    Store.activeView(),
    h('div.clearfix.py4')
]);


const render = () => {
    vnode = patch(vnode, view());
};


/** Select tab **/
const setActiveView = view => {
    Store.activeView = view;
    render();
};



/*******************************************************
 *                                                     *
 *                     NETWORK IO                      *
 *                                                     *
 *******************************************************/


/**
 * Generic GET. Expects JSON.
 */
const _get = url => fetch(url, {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    },
    credentials: 'same-origin'
})
    .then(res => res.json(),
        err => alert(err));

/**
 * Generic POST. Posts JSON, expects JSON.
 */
const _post = (url, data) => fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    credentials: 'same-origin'
})
    .then(res => res.json(),
        err => alert(err));


/**
 * Generic PUT. Posts JSON, expects JSON.
 */
const _put = (url, data) => fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    credentials: 'same-origin'
})
    .then(res => res.json(),
        err => alert(err));


/**
 * Generic DELETE. Expects JSON.
 */
const _delete = url => fetch(url, {
    method: 'DELETE',
    headers: {
        'Accept': 'application/json'
    },
    credentials: 'same-origin'
})
    .then(res => res.json(),
        err => alert(err));


/**
 * User model
 */

const createUser = () => ({
    email: '',
    telephone: '',
    name: '',
    need: '',
    diagnoses: '',
    start: '',
    acute: 'nej',
    departments: '', // ;-separated list of department names
    registered: new Date().toISOString()
});

const createDepartments = () => ({
    utrednings_enheten: { display: 'Utredningsenheten', date: '', number: '' },
    affektiva_programmet: { display: 'Afektiva programmet', date: '', number: '' },
    internet_psykiatri: { display: 'Internet psykiatri', date: '', number: '' },
    psykosprogrammet: { display: 'Psykosprogrammet', date: '', number: '' },
    affektiva_mottagningen: { display: 'Affektiva mottagningen', date: '', number: '' }
});

// STORE

const Store = {
    activeView: InfoView,
    users: [],
    userForm: createUser(),
    departments: createDepartments()
};


const getDepartments = () => _get("/api/departments")
    .then(data => {
        if (data.error) {
            alert("Oväntat fel: " + data.data);
            render();
            return;
        }
        Store.departments = data.data ? data.data : createDepartments();
        render();
    });

const saveDepartments = () => {
    if (confirm('Uppdatera data för enheterna?')) {
        return _post("/api/departments", Store.departments)
            .then(data => {
                if (data.error) {
                    alert("Oväntat fel: " + data.data);
                    render();
                    return;
                }
                return getDepartments();
            });
    }
};

const getAllUsers = () => _get("/api/users")
    .then(data => {
        if (data.error) {
            alert("Oväntat fel: " + data.data);
            render();
            return;
        }
        Store.users = data.data ? data.data : [];
        render();
    });

const doSaveUser = () => _post('/api/users', Store.userForm)
    .then(res => {
        if (res.error) {
            alert(`Oväntat fel: ${res.data}`);
            render();
            return;
        }
        Store.userForm = createUser();
        return getAllUsers();
    });

const doDeleteUser = () => _delete('/api/users?email=' + Store.userForm.email)
    .then(res => {
        if (res.error) {
            alert(`Oväntat fel: ${res.data}`);
            render();
            return;
        }
        Store.userForm = createUser();
        return getAllUsers();
    });

const departmentsFormChange = (key, vbl, ev) => {
    ev.preventDefault();
    Store.departments[key][vbl] = ev.target.value;
    render();
};

const isValidTelephoneNumber = s => /^([0-9]{10})|([0-9]{3}-[0-9]{7})$/.test(s);

const isValidEmail = s => /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/.test(s);

const isValidUserName = s => /^[A-Za-zÅåÖöÄä ]{4,30}$/.test(s);

const isValidDate = date => /^[0-9]{4}(-[0-9]{2}){2}$/.test(date) && !isNaN(Date.parse(date));

const isValidUser = () => {
    const user = Store.userForm;
    return isValidEmail(user.email) &&
        isValidTelephoneNumber(user.telephone) &&
            isValidUserName(user.name) &&
                isValidDate(user.start) &&
                    user.need >= 1 && user.need <= 4
};


const userFormChange = (key, ev) => {

    ev.preventDefault();

    if (key === 'departments') {

        const val = ev.target.value;

        let vals = Store.userForm.departments.split(';');

        const idx = vals.indexOf(val);

        if (idx < 0) {
            // Selection was just checked - add it
            vals.push(val);
        } else {
            // Selection was just unchecked - remove it
            vals.splice(idx, 1);
        }

        Store.userForm.departments = vals.join(';');

    } else {
        Store.userForm[key] = ev.target.value;

    }
    render();
};

const saveUser = ev => {
    ev.preventDefault();
    const u = Store.userForm;
    if (confirm(`Stämmer detta?\n\nNamn: ${u.name}\nEpost: ${u.email}\nTelefonnummer: ${u.telephone}\nAntal patienter som behövs: ${u.need}\nAkut behov? ${u.acute}\nÖnskade diagnoser: ${u.diagnoses}\nÖnskar påbörja: ${u.start}`)) {
        doSaveUser();
    }
};

const deleteUser = ev => {
    ev.preventDefault();
    if (confirm(`Radera användare ${Store.userForm.email}?`)) {
        doDeleteUser();
    }
};

const toggleSelectUser = (user, ev) => {
    ev.preventDefault();
    if (user.email === Store.userForm.email) {
        Store.userForm = createUser();
    } else {
        Store.userForm = JSON.parse(JSON.stringify(user));
    }
    render();
};

/*********************************************************
 *                                                       *
 *                    INITIALIZATION                     *
 *                                                       *
 *********************************************************/

const mount = id => {
    vnode = patch(document.getElementById(id), view());
    render();
};


const init = id => {
    mount(id);
    return getAllUsers().then(_ => getDepartments());
};


export {
    _get,
    _post,
    _put,
    _delete,
    init,
    userFormChange,
    departmentsFormChange,
    saveUser,
    saveDepartments,
    deleteUser,
    toggleSelectUser,
    isValidUser,
    isValidTelephoneNumber,
    isValidEmail,
    isValidDate,
    isValidUserName,
    setActiveView,
    Store
}

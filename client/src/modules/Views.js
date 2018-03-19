'use strict';
import h from 'snabbdom/h'
import {
    Store, userFormChange, saveUser, deleteUser, toggleSelectUser,
    isValidUser, isValidTelephoneNumber, isValidEmail, isValidDate, isValidUserName,
    departmentsFormChange, saveDepartments, setActiveView
} from './App'


const Navigation = () => h('div.clearfix.py3', [
    h('div.sm-col.sm-col-12', [
        h('clearfix#main-nav', [
            h('div.sm-col.sm-col-4.txtcenter', [
                h('a', {
                    class: {active: Store.activeView === InfoView},
                    props: {href: "#"},
                    on: {click: ev => { ev.preventDefault(); setActiveView(InfoView); }}
                }, 'Information')
            ]),
            h('div.sm-col.sm-col-4.txtcenter', [
                h('a', {
                    class: {active: Store.activeView === DepartmentsView},
                    props: {href: "#"},
                    on: {click: ev => { ev.preventDefault(); setActiveView(DepartmentsView); }}
                }, 'Enheter/Program')
            ]),
            h('div.sm-col.sm-col-4.txtcenter', [
                h('a', {
                    class: {active: Store.activeView === UsersView},
                    props: {href: "#"},
                    on: {click: ev => { ev.preventDefault(); setActiveView(UsersView); }}
                }, 'Användare')
            ])
        ])
    ])
]);

const InfoView = () => h('div.clearfix.py2', [
    h('div.sm-col.sm-col-12', [
        h('clearfix', [
            h('div.sm-col.sm-col-12', [
                h('h2.info-heading', 'Fem enkla steg till steg-1 patient.'),
                h('img', {
                    props: {
                        src: "/files/sinnen.jpeg",
                        alt: 'Sinnen',
                        height: 188,
                        width: 200
                    },
                    style: {
                        float: 'left',
                        padding: '0.1em'
                    },
                }),
                h('p', '1. Fyll i dina uppgifter.'),
                h('p', '2. Välj enhet/program där du önskar hitta steg-1 patient.'),
                h('p', '3. Genom att klicka på spara/skicka, sparas dina uppgifter och samtidigt skickas ett automatiskt mail till de enheter/program du har valt. Det finns även en lista med registrerade mailadresser för de personer som kommer att få ditt mail.'),
                h('p', '4. Dina uppgifter finns kvar om du inte tar bort dem själv. Du ansvarar för uppdatering och ändring av dina uppgifter. Viktigt att ta bort ditt namn från listan om du redan hittat steg-1 patient.'),
                h('p', '5. Du kan ta kontakt med enheter/program så många gånger du behöver, men tänk på att inte skicka alldeles för många mail utan anledning!'),
                h('p', 'Lycka till!')
            ])
        ]),
        h('clearfix.py2', [h('hr')]),
        h('clearfix', [
            h('div.sm-col.sm-col-12', [
                h('h2.info-heading', 'Information till olika enheter/program inom PSV.'),
                h('h3.info-heading', 'Vilka är lämpliga KBT steg-1 patienter?'),
                h('p', '1. Patienter som har gjort klart BAS utredning.'),
                h('p', '2. Patienter som inte har ADHD, autism-spektrum störning, personlighetssyndrom. Patienter som inte har substanssyndrom.'),
                h('p', '3. Patienter som är motiverade att påbörja en behandling.'),
                h('p', '4. Patienter som kan komma, tider som passar.'),
                h('p', '5. Patienter som kan specificera ett problemområde.'),
                h('p', '6. Lämpliga diagnoser: Ångest (social fobi, GAD, panikångest, specifik fobi). Depression utan suicidrisk.'),
                h('p', '7. Patienterna betalar vanligt läkarbesök, frikort gäller.'),
                h('br'),
                h('h3.info-heading', 'Praktisk information'),
                h('p', '1. Utbildningen pågår i 2 terminer, 1 år. '),
                h('p', '2. Varje ST-läkare behöver genomföra 1-2 terapier under hela KBT utbildningen.'),
                h('p', '3. Ibland kan det uppstå ytterligare behov under hela året, det finns patienter som hoppar av eller inte anses vara lämpliga för steg-1.'),
                h('p', '4. Alla sessioner spelas in (filmas ej) och handledningen pågår kontinuerligt.'),
                h('p', '5. Det går att ha en mer komplicerad patient under utbildningsterapi, men man behöver fokusera på ett problemområde i så fall.'),
                h('p', '6. En terapi kan ta allt från 7 sessioner upp till 20 sessioner ibland.'),
                h('p', '7. ST-läkaren får inte ha ansvar för mediciner, recept, sjukskrivning, intyg, remisser, mm under pågående terapi. Det måste finnas en annan patient-ansvarig-läkare (PAL) under tiden.')
            ])
        ])
    ])
]);


const UsersView = () => h('div.clearfix.py2', [
    h('div.sm-col.sm-col-12', [
        h('div.clearfix', [
            h('div.sm-col.sm-col-12', [
                h('table#users', [
                    h('thead', [
                        h('tr', [
                            h('th.left-align', 'Namn'),

                            h('th.left-align', 'Epost'),
                            h('th.left-align', 'Telefonnummer'),
                            h('th.left-align', 'Önskar påbörja'),
                            h('th.left-align', 'Diagnoser'),
                        ])
                    ]),
                    h('tbody', Store.users.map(u =>
                        h('tr.user-row.pointer', {
                            class: {
                                'selected': u.email === Store.userForm.email
                            },
                            on: {
                                click: toggleSelectUser.bind(null, u)
                            }
                        }, [
                            h('td.left-align', u.name),
                            h('td.left-align', u.email),
                            h('td.left-align', u.telephone),
                            h('td.left-align', u.start),
                            h('td.left-align', u.diagnoses)
                        ])))
                ])
            ])
        ]),

        // User new/edit form

        h('div.clearfix.my4.py4', [
            h('div.sm-col.sm-col-12', [
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12.h4.underline.my1', 'Användaruppgifter')
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12', [
                        h('input.input', {
                            class: {
                                error: Store.userForm.name !== '' && !isValidUserName(Store.userForm.name)
                            },
                            props: {
                                placeholder: 'Namn och efternamn',
                                type: 'text',
                                value: Store.userForm.name
                            },
                            on: {
                                change: userFormChange.bind(null, 'name')
                            }
                        })
                    ])
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12', [
                        h('input.input', {
                            class: {
                                error: Store.userForm.email !== '' && !isValidEmail(Store.userForm.email)
                            },
                            props: {
                                placeholder: 'Kontakt epost',
                                type: 'text',
                                value: Store.userForm.email
                            },
                            on: {
                                change: userFormChange.bind(null, 'email')
                            }
                        })
                    ])
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12', [
                        h('input.input', {
                            class: {
                                error: Store.userForm.telephone !== '' && !isValidTelephoneNumber(Store.userForm.telephone)
                            },
                            props: {
                                placeholder: 'Kontakt telefonnummer',
                                type: 'text',
                                value: Store.userForm.telephone
                            },
                            on: {
                                change: userFormChange.bind(null, 'telephone')
                            }
                        })
                    ])
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12', [
                        h('input.input', {
                            class: {
                                error: Store.userForm.need !== '' && (Store.userForm.need < 1 || Store.userForm.need > 4)
                            },
                            props: {
                                placeholder: 'Antal patienter som behövs',
                                type: 'text',
                                min: '1',
                                max: '4',
                                value: Store.userForm.need
                            },
                            on: {
                                change: userFormChange.bind(null, 'need')
                            }
                        })
                    ])
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12', [
                        h('input.input', {
                            props: {
                                placeholder: 'Önskade diagnoser',
                                type: 'text',
                                value: Store.userForm.diagnoses
                            },
                            on: {
                                change: userFormChange.bind(null, 'diagnoses')
                            }
                        })
                    ])
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-12', [
                        h('input.input', {
                            class: {
                                error: Store.userForm.start !== '' && !isValidDate(Store.userForm.start)
                            },
                            props: {
                                placeholder: 'Önskar påbörja, datum (YYYY-MM-DD)',
                                type: 'text',
                                value: Store.userForm.start
                            },
                            on: {
                                change: userFormChange.bind(null, 'start')
                            }
                        })
                    ])
                ]),
                h('div.clearfix.mb3', [
                    h('div.sm-col.sm-col-12', [
                        h('span.six3.mr4', 'Akut behov av steg-1 patient?'),
                        h('select', {
                                on: {
                                    change: userFormChange.bind(null, 'acute')
                                }
                            }, ['ja', 'nej'].map(opt =>
                                h('option', {
                                    props: {
                                        value: opt,
                                        selected: opt === Store.userForm.acute ? 'selected' : undefined
                                    }
                                }, opt)
                            )
                        )
                    ])
                ]),
                h('div.clearfix.mb2', [
                    h('div.sm-col.sm-col-6', [
                        h('span.mr4.underline', 'Enheter som jag vill kontakta')
                    ]
                        .concat(
                            [
                                'Utredningsenheten',
                                'Afektiva programmet',
                                'Internet psykiatri',
                                'Psykosprogrammet',
                                'Affektiva mottagningen'
                            ]
                                .map(opt =>
                                    h('p', [
                                        h('input.mr1', {
                                            props: {
                                                type: 'checkbox',
                                                value: opt,
                                                checked: Store.userForm.departments.split(';').indexOf(opt) >= 0
                                            },
                                            on: {
                                                change: userFormChange.bind(null, 'departments')
                                            }
                                        }, opt),
                                        h('span.six3', opt)
                                    ]))
                        )),
                    h('div.sm-col.sm-col-6', [
                        h('img', {
                            props: {
                                src: "/files/vad.jpeg",
                                alt: "tänk-känn-gör",
                                height: 228,
                                width: 286
                            }
                        })
                    ])
                ]),
                h('div.clearfix', [
                    h('div.sm-col.sm-col-6', [
                        h('button.btn.btn-small.btn-primary.bg-green', {
                            props: {
                                disabled: !isValidUser(Store.userForm)
                            },
                            on: {
                                click: saveUser
                            }
                        }, 'Spara')
                    ]),
                    h('div.sm-col.sm-col-6', [
                        h('button.btn.btn-small.btn-primary.bg-red.right', {
                            props: {
                                disabled: !isValidUser(Store.userForm)
                            },
                            on: {
                                click: deleteUser
                            }
                        }, 'Radera')
                    ])
                ])
            ])
        ])
    ])
]);

const DepartmentsView = () => h('div.clearfix.py2', [
    // Departments
    h('div.clearfix', [
        h('div.sm-col.sm-col-12', [
            h('div.clearfix', [
                h('div.sm-col.sm-col-12.underline.h4', 'Lämpliga KBT steg-1 patienter finns på:')
            ]),
            h('div.clearfix.my2', [
                h('div.sm-col.sm-col-4.p1'),
                h('div.sm-col.sm-col-4', 'Datum'),
                h('div.sm-col.sm-col-4', 'Antal patienter'),
            ]),
            h('div.clearfix',
                Object.keys(Store.departments).map(key => {
                    const dep = Store.departments[key];

                    return h('div.clearfix', [
                        h('div.sm-col.sm-col-4.six3', dep.display),
                        h('div.sm-col.sm-col-4.six3', [
                            h('div.clearfix', [
                                h('div.sm-col.sm-col-11', [
                                    h('input.input', {
                                        props: {
                                            type: 'text',
                                            placeholder: 'YYYY-MM-DD',
                                            value: dep.date
                                        },
                                        on: {
                                            change: departmentsFormChange.bind(null, key, 'date')
                                        }
                                    })
                                ])
                            ])
                        ]),
                        h('div.sm-col.sm-col-4.six3', [
                            h('div.clearfix', [
                                h('div.sm-col.sm-col-11', [
                                    h('input.input', {
                                        props: {
                                            type: 'text',
                                            placeholder: 'antal',
                                            value: dep.number,
                                            min: '0'
                                        },
                                        on: {
                                            change: departmentsFormChange.bind(null, key, 'number')
                                        }
                                    })
                                ])
                            ])
                        ])
                    ])
                })
            ),
            h('div.clearfix', [
                h('div.sm-col.sm-col-12', [
                    h('button.btn.btn-small.btn-primary.bg-green.right', {
                        on: {
                            click: saveDepartments
                        }
                    }, 'Updatera')
                ])
            ])
        ])
    ])
]);

export { Navigation, InfoView }

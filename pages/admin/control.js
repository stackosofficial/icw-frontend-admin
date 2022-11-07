import axios from 'axios';
import React, { useEffect, useState } from 'react';
import styles from './control.module.css'
import { useRouter } from 'next/router';
import { categoriesList, clientSendToken } from '../../components/common';
import Modal from 'react-modal';

    const customStyles = {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
        },
      };
      

export default function Control({NEXT_PUBLIC_BE_URL})
{
    var [events, setEvents] = useState([]);
    const [isSuccess, setSuccess] = useState(false);
    const [isError, setError] = useState('');
    const [changeID, setChangeID] = useState(0);
    var [filterOptions, setFilterOptions] = useState({});
    var [filteredEvents, setFilteredEvents] = useState([]);
    const [isSaveDisabled, setSaveDisabled] = useState(false);
    const [delModalData, setDelModal] = useState({});
    const [password, setPassword] = useState('');
    const router = useRouter();

    const [eventChanges, setEventChanges] = useState({
        updatedEvents: {},
        addedEvents: {},
        deletedEvents:[],
    });

    const getID = (index) => {
        return `newID_${index}`;
    }

    const compareField = (filt, val) => {
        const matches = val.toLowerCase().match(filt.toLowerCase());
        console.log("compareField: ", val.toLowerCase(), filt.toLowerCase(), JSON.stringify(matches), matches && matches.length > 0);
       return  matches && matches.length > 0;
    }

    const filterEvents = (filter, eventsParam) => {
        filterOptions = {...filterOptions, ...filter};
        setFilterOptions(filterOptions);

        let sourceEvents = events;
        if(eventsParam) {
            sourceEvents = eventsParam;
        }

        filteredEvents = sourceEvents.filter((event) => {
            if(filterOptions.name && (!event.name || !compareField(filterOptions.name, event.name))) {
                return false;
            }
            if(filterOptions.contact && (!event.contact || !compareField(filterOptions.contact, event.contact))) {
                return false;
            }
            if(filterOptions.link && (!event.link || !compareField(filterOptions.link, event.link))) {
                return false;
            }
            if(filterOptions.from && (!event.from || !compareField(filterOptions.from, event.from))) {
                return false;
            }
            if(filterOptions.to && (!event.to || !compareField(filterOptions.to, event.to))) {
                return false;
            }
            if(filterOptions.createdDate && (!event.createdDate || !compareField(filterOptions.createdDate, event.createdDate))) {
                return false;
            }
            if(filterOptions.venue && (!event.venue || !compareField(filterOptions.venue, event.venue))) {
                return false;
            }
            if(filterOptions.senderIP && (!event.senderIP || !compareField(filterOptions.senderIP, event.senderIP))) {
                return false;
            }
            if(filterOptions.status && (!event.status || !compareField(filterOptions.status, event.status))) {
                return false;
            }
            if(filterOptions.createdByEmail && (!event.createdByEmail || !compareField(filterOptions.createdByEmail, event.createdByEmail))) {
                return false;
            }
            if(filterOptions.phoneNo && (!event.phoneNo || !compareField(filterOptions.phoneNo, event.phoneNo))) {
                return false;
            }
            return true;
        });

        console.log("filteredEvents: ", JSON.stringify(filteredEvents));
        setFilteredEvents(filteredEvents);
    }
    
    const setEventsFunc = (newEventList) => {
        events = newEventList;
        setEvents(events);
        filterEvents({}, newEventList);
    }

    const getAllEvents = async (passwordParam) => {
        setSaveDisabled(true);

        let sendToken = await fetchToken();
        let sendPass = password;

        if(!sendPass) {
            sendPass = passwordParam;
        }
        console.log("sendToken: ", sendToken);

        axios.post(`${NEXT_PUBLIC_BE_URL}/admin/events`,
            {
                auth: {
                    token: clientSendToken(sendPass, sendToken)
                }
            }
        ).then((res) => {
            console.log("events: ",JSON.stringify(res.data));
            setSaveDisabled(false);
            if(res && res.data && res.data.success) {
                setEventsFunc(res.data.eventList);
                
            }
            if(res && res.data && res.data.reason) {
                setError(res.data.reason);
            }

        })
        .catch((err)=> {
            setSaveDisabled(false);
            setSuccess(false);
            setError('Error duing fetching event data');
            console.log("error found: "+err);
        });
    }

    const callModifyAPI = async () => {

        let sendToken = await fetchToken();

        console.log("sendToken: ", sendToken);
        if(!Object.keys(eventChanges.updatedEvents).length
          &&  !Object.keys(eventChanges.addedEvents).length
          && !eventChanges.deletedEvents.length
        ) {
            setSuccess(false);
            setError('Nothing to save');
            return;
        }
        setSuccess(false);
        setError('');
        setSaveDisabled(true);

        axios.post(`${NEXT_PUBLIC_BE_URL}/admin/modify-events`, {
            auth: {
                token: clientSendToken(password, sendToken)
            },
            modifiedEvents: eventChanges
        })
        .then((res) => {
            setSaveDisabled(false);
            if(res && res.data && res.data.success) {
                setEventChanges(
                    {
                        updatedEvents: {},
                        addedEvents: {},
                        deletedEvents:[],
                    }
                );
                
                router.reload(window.location.pathname);
                console.log("success");
            } else {
                setSuccess(false);
                if(res && res.data && !res.data.success && res.data.reason) {
                    setError('ERROR: ' + res.data.reason);
                }
                else {
                    setError('ERROR');
                }
            }
        })
        .catch((err) => {
            console.error("error occured during modify event", err);
            setSuccess(false);
            setSaveDisabled(false);
            setError('ERROR: '+err);
        });
    }

    const addEvent = () => {
        const newID = getID(changeID);
        setChangeID(changeID + 1);

        const event = {"_id" : newID};

        events.push(event)
        setEventsFunc([...events]);

        eventChanges.addedEvents[newID] = event;
        setEventChanges({...eventChanges});
    }

    const deleteEvent = (eventIndex, event, reason) => {
        const eID = event._id;

        if(eventChanges.addedEvents[eID]) {
            delete eventChanges.addedEvents[eID];
        }
        else {
            eventChanges.deletedEvents.push({eventID: eID, reason});
        }

        if(eventChanges.updatedEvents[eID]) {
            delete eventChanges.updatedEvents[eID];
        }

        setEventChanges({...eventChanges});

        events = events.filter((val, index) => index != eventIndex);
        setEventsFunc([...events]);
    }

    const saveModifiedEvent = (index, event, eventChange) => {
        const newID = event._id;
        console.log("event: ", JSON.stringify(event));
        if(eventChanges.addedEvents[newID]) {
            eventChanges.addedEvents[newID] = { ...eventChanges.addedEvents[newID], ...eventChange};
        }
        else {
            eventChanges.updatedEvents[newID] = {...eventChanges.updatedEvents[newID], ...eventChange};
        }

        setEventChanges({...eventChanges});
        events[index] = {...events[index], ...eventChange};
        setEventsFunc([...events]);
    }

    const deleteModalOpen = (event, eventIndex) => {
        setDelModal({isOpen: true, event, eventIndex});
    }

    const setDeleteReason = (reason) => {
        setDelModal({...delModalData, reason});
    }

    const deleteModalClickYes = () => {
        deleteEvent(delModalData.eventIndex, delModalData.event, delModalData.reason);
        setDelModal({});
    }

    const deleteModalClickNo = () => {
        setDelModal({});
    }

    var download = function () {
        writeFile('test.txt', "tsfsdfsdfsdfsf", err => {
            if (err) {
              console.error(err);
            }
            // file written successfully
          });
    };

    const logout = async () => {

        const sendToken = await fetchToken();

        axios.post(`${NEXT_PUBLIC_BE_URL}/admin/logout`, {
            auth: {
                token: clientSendToken(password, sendToken)
            }
        })
        .then((res) => {
            if(res && res.data && res.data.success) {
                setSuccess('successfully logged out');
                console.log("Successfully logged out");
            }
            if(res && res.data && res.data.reason) {
                setError(res.data.reason);
            }
        })
        .catch((err) => {
            console.error(err);
            setError('An error occured when sending logout request');
        })
    }

    const fetchToken = async () => {
        const res = await axios.get(`${NEXT_PUBLIC_BE_URL}/admin/token`);
        if(res && res.data && res.data.success) {
            console.log("res auth: ", res.data.auth.token);
        }
        else {
            if(res && res.data && res.data.reason) {
                setError(res.data.reason);
            }
            else {
                setError('Failed to validate token.')
            }
        }

        return res.data.auth.token;
    }

    useEffect(() => {
        const run = async () => {
            try {
                const sessionPassword = sessionStorage.getItem("password");

                if(!sessionPassword) {
                    setError('Password is invalid. Please log in.');
                    return;
                }

                await setPassword(sessionPassword);

                getAllEvents( sessionPassword);

            } catch(error) {
                console.error(error);
                setError("An Error occured");
            }
        };
        run();
    }, []);

    const renderEvents = ()=> {
        return filteredEvents.map((event, index) => {
            return (
                <tr className={styles.tableRow} key={index}>
                    <td className={styles.tableCell}>
                        {/* <button onClick={() =>deleteEvent(index, event)}>DEL</button> */}
                        {/* deleteModalOpen */}
                        <button onClick={() =>deleteModalOpen(event, index)}>DEL</button>
                    </td>
                    <td className={styles.tableCell}>
                        {index + 1}
                    </td>
                    <td className={styles.tableCell}>
                        <input type='text'
                            value={event.name ? event.name : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {name: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <input type='text'
                            value={event.link ? event.link : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {link: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <textarea
                            rows="1"
                            value={event.contact ? event.contact : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {contact: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <input type='datetime-local'
                            value={event.from ? event.from : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {from: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <input type='datetime-local'
                        value={event.to ? event.to : ''}
                        onChange={(e) => saveModifiedEvent(index, event, {to: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <input type='text'
                        value={event.venue ? event.venue : ''}
                        onChange={(e) => saveModifiedEvent(index, event, {venue: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <input type='text'
                        value={event.createdByEmail ? event.createdByEmail : ''}
                        onChange={(e) => saveModifiedEvent(index, event, {createdByEmail: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <input type='text'
                        value={event.phoneNo ? event.phoneNo : ''}
                        onChange={(e) => saveModifiedEvent(index, event, {phoneNo: e.target.value})}
                        />
                    </td>
                    <td className={styles.tableCell}>
                        <span>{event.createdDate}</span>
                    </td>
                    <td className={styles.tableCell}>
                        <select name="category"
                            value={event.category ? event.category : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {category: e.target.value})}
                            >
                            {
                                categoriesList.map((category) => {
                                    return (
                                        <option key={category} value={category}>{category}</option>
                                    );
                                })
                            }
                        </select>
                    </td>
                    
                    <td className={styles.tableCell}>
                        <input type='text'
                            value={event.senderIP ? event.senderIP : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {senderIP: e.target.value})}
                            />
                    </td>
                    <td className={styles.tableCell}>
                        <select name="status"
                            value={event.status ? event.status : ''}
                            onChange={(e) => saveModifiedEvent(index, event, {status: e.target.value})}
                            >
                            <option value="W">Waiting</option>
                            <option value="A">Approved</option>
                        </select>
                    </td>
                </tr>
            );
            index+=1;
        });
    }

    console.log('restart');
    return (
        <div>
            {/* {
                <Modal
                isOpen={delModalData.isOpen}
                style={customStyles}>
                    <div>
                        <div>Do you want to delete?</div>
                        <div>
                            <input type='text' onChange={(e) => setDeleteReason(e.target.value)}/>
                            <button onClick={deleteModalClickYes}>YES</button>
                            <button onClick={deleteModalClickNo}>NO</button>
                        </div>
                    </div>
                </Modal>
            } */}
            {
                <Modal
                    isOpen={delModalData.isOpen}
                    style={customStyles}>
                    <div>
                        <div>Do you want to delete?</div>
                        <div>
                            <input type='text' onChange={(e) => setDeleteReason(e.target.value)}/>
                            <button onClick={deleteModalClickYes}>YES</button>
                            <button onClick={deleteModalClickNo}>NO</button>
                        </div>
                    </div>
                </Modal>
            }
            <div className={styles.section}>
                <div className={styles.saveLogout}>
                    <div>
                        <button onClick={callModifyAPI} disabled={isSaveDisabled}>SAVE</button>
                        {
                            isError ?
                                <span className={styles.failed}>{isError}</span>
                            : !isError && isSuccess? 
                            <span className={styles.saved}> Saved</span>
                            : ''
                        }
                    </div>
                    <div>
                        <button onClick={download}>Download</button>
                    </div>
                </div>
                <div>
                    <table className={styles.table}>
                        <tbody>
                            <tr className={styles.tableRow}>
                                <th className={styles.tableCell}>DEL</th>
                                <th className={styles.tableCell}>ID</th>
                                <th className={styles.tableCell}>
                                    Name
                                    <input type='text'
                                        onChange={(e) => filterEvents({name: e.target.value})}
                                        />
                                    </th>
                                <th className={styles.tableCell}>
                                    Link
                                    <input type='text'
                                        onChange={(e) => filterEvents({link: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>
                                    Contact
                                    <input type='text'
                                        onChange={(e) => filterEvents({contact: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>
                                    From(YYYY-MM-DDtHH-MM)
                                    <input type='text'
                                        onChange={(e) => filterEvents({from: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>
                                    To(YYYY-MM-DDtHH-MM)
                                    <input type='text'
                                        onChange={(e) => filterEvents({to: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>Venue
                                    <input type='text'
                                        onChange={(e) => filterEvents({venue: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>CreatedBy
                                    <input type='text'
                                        onChange={(e) => filterEvents({createdByEmail: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>PhoneNo
                                    <input type='text'
                                        onChange={(e) => filterEvents({phoneNo: e.target.value})}
                                        />
                                </th>
                                <th className={styles.tableCell}>
                                    CreatedDate
                                    <input type='text'
                                        onChange={(e) => filterEvents({createdDate: e.target.value})}
                                    />
                                </th>
                                <th className={styles.tableCell}>
                                    Category
                                    <input type='text'
                                        onChange={(e) => filterEvents({category: e.target.value})}
                                    />
                                </th>
                                <th className={styles.tableCell}>
                                    senderIP
                                    <input type='text'
                                        onChange={(e) => filterEvents({senderIP: e.target.value})}
                                    />
                                </th>
                                <th className={styles.tableCell}>
                                    Status
                                    <input type='text'
                                        onChange={(e) => filterEvents({status: e.target.value})}
                                        />
                                </th>
                            </tr>
                            {
                                renderEvents().map((event)=>
                                event)
                            }
                        </tbody>
                    </table>
                </div>
                <div>
                    <button onClick={addEvent}>ADD EVENT</button>
                </div>
            </div>
        </div>
        
    );
}
import {useEffect, useState} from 'react';
import { clientSendToken } from '../../components/common';
import axios from 'axios';
import styles from './newsletter.module.css';

export default function NewsletterList({NEXT_PUBLIC_BE_URL}) {
    
    const [pass, setPass] = useState('');
    const [emailList, setEmailList] = useState([]);
    const [isError, setErrorMsg] = useState('')


    const getTextAreaString = () => {
        return emailList.map((emailObj) => {
            return `${emailObj.email};`
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

    useEffect(()=>{
        const run = async() => {
            const sessionPassword = sessionStorage.getItem("password");

            if(!sessionPassword) {
                setError('Password is invalid. Please log in.');
                return;
            }
            setPass(sessionPassword);

            const token = await fetchToken();
            axios.post(`${NEXT_PUBLIC_BE_URL}/admin/newsletter`,
            {
                auth: {
                    token: clientSendToken(sessionPassword, token)
                }
            })
            .then((res) => {
                if(res && res.data && res.data.success) {
                    setEmailList(res.data.emailList);
                }
                else {
                    setErrorMsg(`Failed to retreive emaillist. ${res.data?.reason}`);
                }
            })
            .catch((err) => {
                console.error(err);
                setErrorMsg(`An error occured while fetch. Check console`);
            })    
        }

        run();

    }, []);

    return (
        <div>
            <div className={styles.section}>
                <div className={styles.tableSection}>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <td className={styles.tableCell}>EMAIL</td>
                            </tr>
                            {
                                emailList?.map((emailObj) => (
                                    <tr>
                                        <td className={styles.tableCell}>
                                            {emailObj.email}
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                <div>
                    <textarea
                        value={
                            emailList?.map((emailObj) => {
                                return `${emailObj.email};`
                            })
                        }
                    />
                </div>
            </div>

        </div>
    )
}
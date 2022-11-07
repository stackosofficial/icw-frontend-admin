import { clientSendToken } from '../../components/common';
import {useState, useEffect} from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Login ({NEXT_PUBLIC_BE_URL}) {

    const [pass, setPass] = useState('');
    const [errMsg, setError] = useState('');
    const [isDisabled, setDisabled] = useState(false);
    const router = useRouter();

    const onClick = async () => {
        setDisabled(true);

        const token = await fetchToken();

        axios.post(`${NEXT_PUBLIC_BE_URL}/admin/login`,
        {
            auth: {
                token: clientSendToken(pass, token)
            }
        })
        .then((res) => {
            setDisabled(false);
            if(res && res.data) {
                if(res.data.success) {
                    const loginTime = new Date(new Date().getTime() + res.data.loginEnd);
                    window.sessionStorage.setItem("loginEndTime", loginTime);
                    setError("login is successful");
                    console.log("url: ", URL);
                    // router.reload(window.ur);
                }
                else {
                    setError('ERROR:'+res.data.reason);
                }
                if(res.data.isLogged) {
                    console.log("saving password");
                    window.sessionStorage.setItem("password", pass);
                    router.push('/admin/control');
                }
            }
            else {
                setError('ERROR: server could not validate the token.')
            }
        })
        .catch((err) => {
            setDisabled(false);
            console.error(err);
            setError('ERROR: could not submit');
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

    return (
        <div>
            <span>Login:</span>
            <input type='text'
                value={pass?pass:''}
                onChange={(e)=> setPass(e.target.value)}
            />
            <button
            onClick={onClick}
            disable={isDisabled}
            >LOGIN</button>
            <span>
                {
                    errMsg? errMsg:''
                }
            </span>
        </div>)
}
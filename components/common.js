import {AES, enc} from 'crypto-js';
export const categoriesList = [
    "Meetup",
    "Workshop",
    "Conference",
    "Talks & Networking",
    "Networking & After-party",
];

const reverse = (str) => {
    const arr = str.split("");
    const rev = arr.reverse();
    const newStr = rev.join("");
    return newStr;
}

export const clientSendToken = (password, svToken) => {
    console.log("clientsend", svToken, password);
    let clRecvBase = '';
    try {
        const clRecvToken = AES.decrypt(svToken, password).toString(enc.Utf8);
        clRecvBase = reverse(clRecvToken);
    }
    catch(err) {
        console.error(err);
    }
    
    const encryptMsg = AES.encrypt(clRecvBase, password).toString();
    return encryptMsg
}
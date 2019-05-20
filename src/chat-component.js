import React from 'react';
import socketIOClient from 'socket.io-client';

export class ChatComponent extends React.Component {
    socket;
    messageView;
    userName = '';
    constructor() {
        super();
        this.state = {
            messages: [],
            response: false,
            endpoint: `http://${window.location.hostname}:4000`,
            isUsernameSet: false
        }
    }

    ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    str2ab(str) {
        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    componentDidMount() {
        this.messageView = document.querySelector('#messageView');
        const { endpoint } = this.state;
        this.socket = socketIOClient(endpoint);
        this.socket.on("common-room", data => {
            if (data.originalUserName) {
                this.userName = data.originalUserName;
            }
            let decodedData = data.message;
            let currentMessageLine = '';
            if (data.type === 'image') {
                const imageBytes = new Uint8Array(data.message);
                const imageData = 'data:image/png;base64,' + this.encodeTypedArrayToBase64(imageBytes);
                currentMessageLine = <div><div>{data.userName}:</div><div><img src={imageData} alt="Incoming" width="50%"></img></div></div>;
            } else {
                if (data.message instanceof ArrayBuffer) {
                    decodedData = this.ab2str(data.message);
                }
                if (data.userName) {
                    decodedData = `${data.userName}: ${decodedData}`;
                }
                currentMessageLine = <div key={this.state.messages.length}>{decodedData}</div>;
            }
            this.setState({ messages: this.state.messages.concat([currentMessageLine]) });
        });
    }

    sendMessage() {
        const message = document.querySelector('textarea').value;
        const messageBuffer = this.str2ab(message);
        this.socket.emit('common-room', { message: messageBuffer, type: 'text', userName: this.userName });
    }

    sendImage(event) {
        event.persist();
        const imageData = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.onloadend = (event) => {
            const imageBuffer = event.target.result;
            this.socket.emit('common-room', { message: imageBuffer, type: 'image', userName: this.userName });
        };
        fileReader.readAsArrayBuffer(imageData);
    }

    encodeTypedArrayToBase64(input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    }

    setUsername() {
        const originalUserName = this.userName;
        this.userName = document.querySelector('#username').value;
        this.socket.emit('user-update', { originalUserName: originalUserName, updatedUserName: this.userName });
        this.setState({ isUsernameSet: true });
    }

    userNameInput() {
        if (!this.state.isUsernameSet) {
            return (
                <div>
                    <input type="text" placeholder="Enter Username" id="username" />
                    <button onClick={(event) => this.setUsername()}>Submit</button>
                </div>
            );
        } else {
            return (<div></div>);
        }
    }

    render() {
        return (<div id="chat-window-container" style={{ height: '100%' }}>
            <div>
                Chat
            </div>
            <div>
                {this.userNameInput()}
            </div>
            <div id="messageView" style={{ height: '80%', overflowY: "auto" }}>
                {this.state.messages}
            </div>
            <div style={{display: 'flex'}}>
                <div style={{float: 'left', display: 'flex', width: '50%', alignItems: 'center', justifyContent: 'center'}}>
                    <textarea placeholder="Enter text here" rows="3" style={{width: '98%', margin: '1%', borderRadius: '3px'}}></textarea>
                </div>
                <div style={{float: 'left', display: 'flex', width: '50%', alignItems: 'center', justifyContent: 'center'}}> 
                    <input type="file" onChange={(event) => { this.sendImage(event) }} placeholder="Send Image" />
                </div>
            </div>
            <div>
                <button onClick={() => { this.sendMessage() }}>Send</button>
            </div>
        </div>);
    }
}


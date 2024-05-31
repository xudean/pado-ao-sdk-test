import {useRef, useState} from 'react'
import './App.css'
import {uploadData, generateKey, submitTask, getResult} from "@padolabs/pado-ao-sdk";
import Arweave from "arweave";

function App() {
    const [cliecked, setCliecked] = useState()
    const [address, setAddress] = useState()
    const [fileContent, setFileContent] = useState('');
    const fileInputRef = useRef(null);
    const ARConfig = {
        host: '127.0.0.1',
        port: 1984,
        protocol: 'http'
    };
    const arweave = Arweave.init(ARConfig)


    const connectWallet = async () => {
        setCliecked(true)
        try {
            await window.arweaveWallet.connect(
                // request permissions to read the active address
                [
                    "ACCESS_ADDRESS",
                    "SIGN_TRANSACTION",
                ]
            );
        } catch (e) {
            console.log(e)
            setCliecked(false)
        } finally {
            setCliecked(false);
        }
        const addressTmp = await window.arweaveWallet.getActiveAddress()
        setAddress(addressTmp)
        console.log("connect success!")
    }
    const fucUser = async () => {
        try {

            let key = await generateKey();
            // submit a task to AO process
            const taskId = await submitTask("Wknf36cy0H9ksovHBbSTd-mVcpzHH7tMMrgZld2rJF4", key.pk, window.arweaveWallet);
            console.log(`TASKID=${taskId}`);

            // get the result (If you want to do a local test, refer to the README to initialize arweave and then pass it to getResult)
            const [err, data] = await getResult(taskId, key.sk).then(data => [null, data]).catch(err => [err, null]);
            console.log(`err=${err}`);
            console.log(`data=${data}`);
            setCliecked(false)
        } catch (e) {
            console.log(e)
        } finally {
            setCliecked(false)
        }
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file); // 读取文件为文本
            reader.onload = async (e) => {
                const content = e.target.result;
                setFileContent(content);
                console.log(content.byteLength); // 打印文件内容到控制台
                console.log(content); // 打印文件内容到控制台
                // prepare some data
                let data = new Uint8Array(content);

                // tag for the data
                let dataTag = {"testtagkey": "testtagvalue"};

                // price for the data
                let priceInfo = {price: "1", symbol: "AOCRED"};

                // upload your data (If you want to do a local test, refer to the README to initialize arweave and then pass it to uploadData)
                console.log("upload data")
                const dataId = await uploadData(data, dataTag, priceInfo, window.arweaveWallet,arweave);
                console.log(`DATAID=${dataId}`);
            };
        }
    };

    function clearFile() {
        fileInputRef.current.value = '';
    }

    return (
        <>
            <h2>Connect Wallet</h2>
            <div className="card">
                <button disabled={cliecked} onClick={connectWallet}>
                    Connect
                </button><br/>
                {
                    address &&<a>{address}</a>
                }
            </div>
            <hr/>
            <h2>Upload File</h2>
            <div className="card">
                <input type="file"
                       name="myFile"
                       ref={fileInputRef}
                       onChange={handleFileChange}/>
                <button onClick={clearFile}>Clear file</button>
            </div>
        </>
    )
}


export default App

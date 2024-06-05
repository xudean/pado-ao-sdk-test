import {useEffect, useRef, useState} from 'react'
import './App.css'
import {uploadData, generateKey, submitTask, getResult} from "@padolabs/pado-ao-sdk";
import Arweave from "arweave";
import {submitDataToAR} from "@padolabs/pado-ao-sdk/dist/padoarweave.js";
// import { genArweaveAPI } from "arseeding-js";
import {getWalletBalance, logTokenTag, printFee, uploadDataByArseeding} from "./script/arseeding.js";
import {Spin} from "antd";


function App() {
    const [cliecked, setCliecked] = useState()
    const [address, setAddress] = useState()
    const [fileContent, setFileContent] = useState('');
    const [fileContent2, setFileContent2] = useState('');
    const [fileContent3, setFileContent3] = useState('');
    const fileInputRef = useRef(null);
    const fileInputRef2 = useRef(null);
    const fileInputRef3 = useRef(null);
    const [arweaveBalance, setArweaveBalance] = useState(null)
    const [arseedingNeedFee, setArseedingNeedFee] = useState(0)
    const [downloadLink, setDownloadLink] = useState(null)
    const [padoSdkUploading, setPadoSdkUploading] = useState(false)
    const [arweaveUploading, setArweeaveUploading] = useState(false)
    const [arseedingUploading, setArseedingUploading] = useState(false)
    const tag = "arweave,ethereum-ar-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,0x4fadc7a98f2dc96510e42dd1a74141eeae0c1543"


    useEffect(() => {
        const printTokenTag = async () => {
            await logTokenTag()
        }
        printTokenTag()
    })
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
        const balance = await getWalletBalance(tag);
        console.log(balance)
        setArweaveBalance(balance)
        console.log("connect success!")
    }

    const handleFileChange = async (event) => {
        setPadoSdkUploading(true)
        try {
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
                    const dataId = await uploadData(data, dataTag, priceInfo, window.arweaveWallet, arweave);
                    console.log(`DATAID=${dataId}`);
                };
            }
        } catch (e) {
            console.log(e)
        } finally {
            setPadoSdkUploading(false)
        }
    };
    const handleFileChangeArweave = async (event) => {
        setArweeaveUploading(true)
        try {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file); // 读取文件为文本
                reader.onload = async (e) => {
                    const content = e.target.result;
                    setFileContent2(content);
                    console.log(content.byteLength); // 打印文件内容到控制台
                    console.log(content); // 打印文件内容到控制台
                    // prepare some data
                    let data = new Uint8Array(content);
                    console.log('arweave upload start')
                    const transactionId = await submitDataToAR(arweave, data, window.arweaveWallet);
                    console.log(transactionId)

                };
            }
        } catch (e) {
            console.log(e)
        } finally {
            setArweeaveUploading(false)
        }
    };

    const handleFileChangeArseeding = async (event) => {

        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file); // 读取文件为文本
            reader.onload = async (e) => {
                const content = e.target.result;
                setFileContent3(content);
                console.log(content.byteLength); // 打印文件内容到控制台
                console.log(content); // 打印文件内容到控制台
                const fee = await printFee('ar', content.byteLength)
                const decimals = Number(fee.decimals)
                const finalFee = Number(fee.finalFee)
                const divide = Math.pow(10, decimals)
                setArseedingNeedFee(finalFee / divide)
                //todo if you want to save in arweave, need to pay
            };
        }

    };

    const uploadFileByArseeding = async () => {
        setArseedingUploading(true)
        try {
            // prepare some data
            console.log('arseeding-js upload start')
            const order = await uploadDataByArseeding(fileContent3, tag)
            console.log('order:', order)
            debugger
            setDownloadLink('https://arseed.web3infra.dev/' + order.itemId)
        } catch (e) {
            console.log(e)
        } finally {
            setArseedingUploading(false)
        }
    }

    function clearFile() {
        fileInputRef.current.value = '';
    }

    function clearFileArweave() {
        fileInputRef2.current.value = '';
    }

    function clearFileArSeeding() {
        fileInputRef3.current.value = '';
        setDownloadLink(null)
    }

    return (
        <>
            <h2>Connect Wallet</h2>
            <div className="card">
                <button disabled={cliecked} onClick={connectWallet}>
                    Connect
                </button>
                <br/>
                {
                    address && <a>{address}</a>
                }
                <br/>
                {
                    arweaveBalance && <a>AR:{arweaveBalance}</a>
                }
            </div>
            <hr/>
            <h2>Upload File by PADO-AO-SDK</h2>
            <div className="card">
                <input type="file"
                       name="myFile"
                       ref={fileInputRef}
                       onChange={handleFileChange}/>
                <button onClick={clearFile}>Clear file</button>
                {padoSdkUploading && <Spin tip="Loading" size="small"></Spin>}
            </div>
            <hr/>
            <h2>Upload File by Arweave</h2>
            <div className="card">
                <input type="file"
                       name="myFile2"
                       ref={fileInputRef2}
                       onChange={handleFileChangeArweave}/>
                <button onClick={clearFileArweave}>Clear file</button>
                {arweaveUploading && <Spin tip="Loading" size="small"></Spin>}
            </div>
            <hr/>
            <h2>Upload File by Arseeding-js</h2>
            <div className="card">
                <input type="file"
                       name="myFile3"
                       ref={fileInputRef3}
                       onChange={handleFileChangeArseeding}/>
                <button onClick={uploadFileByArseeding}>Upload file</button>
                {arseedingUploading && <Spin tip="Loading" size="small"></Spin>}
                <button onClick={clearFileArSeeding}>Clear file</button>
            </div>
            <div>
                <a>need fee:{arseedingNeedFee} ar</a>
            </div>
            <div>
                {downloadLink && <a href={downloadLink}>download file</a>}
            </div>
            <hr/>
        </>
    )
}


export default App

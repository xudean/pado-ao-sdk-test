import {useCallback, useEffect, useRef, useState} from 'react'
import './App.css'
import {uploadData} from "@xudean/pado-ao-sdk/";
import Arweave from "arweave";
// import {submitDataToAR} from "@xudean/pado-ao-sdk/dist/padoarweave.js";
// import { genArweaveAPI } from "arseeding-js";
import {getWalletBalance, logTokenTag, printFee, uploadDataByArseeding} from "./script/arseeding.js";
import {Input, Select, Spin} from "antd";
// import {Everpay} from 'everpay'
import Everpay from 'everpay'
import {getDataById} from "@xudean/pado-ao-sdk/src/processes/dataregistry";
import {generateKey, getResult, submitTask} from "../../../padolabs/ao/pado-ao-sdk/src/index";


function App() {
    const [cliecked, setCliecked] = useState()
    const [address, setAddress] = useState()
    const [fileContent, setFileContent] = useState('');
    const [storageType, setStorageType] = useState('arweave');
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
    const [arseedingSymbols, setArseedingSymbols] = useState([])
    const [dataId, setDataId] = useState(null)
    const [userDataId, setUserDataId] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedSymbol, setSelectedSymbol] = useState()
    const [taskMsg, setTaskMsg] = useState(null)
    const tag = "arweave,ethereum-ar-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,0x4fadc7a98f2dc96510e42dd1a74141eeae0c1543"
    const storageTypeOps = [{value: 'arweave', label: 'arweave'}, {value: 'arseeding', label: 'arseeding'},]
    const [everpayBalance, setEverpayBalance] = useState(null)

    const printTokenTag = async () => {
        const everpay = await new Everpay()
        everpay.info().then(info => {
            console.log(info.tokenList)
            const symbols = info.tokenList.map(token => {
                const rsp = {}
                rsp['value'] = token.tag;
                rsp['label'] = token.symbol + ' | ' + token.chainType;
                return rsp;
            }).sort((a, b) => a.label.localeCompare(b.label));
            console.log(symbols)
            setArseedingSymbols(symbols)
        })
    }

    useEffect(() => {
        if (storageType === 'arseeding') {
            printTokenTag()
        }
    }, [storageType])


    const ARConfig = {
        host: '127.0.0.1', port: 1984, protocol: 'http'
    };
    const arweave = Arweave.init(ARConfig)

    const connectWallet = async () => {
        setCliecked(true)
        try {
            await window.arweaveWallet.connect(// request permissions to read the active address
                ["ACCESS_ADDRESS", "SIGN_TRANSACTION",]);
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
        debugger
        await setIsUploading(true)
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
                    const data = new Uint8Array(content);
                    // tag for the data
                    let dataTag = {"testtagkey": "testtagvalue"};

                    // price for the data
                    let priceInfo = {price: "1", symbol: "AOCRED"};

                    const extParam = {
                        uploadParam: {
                            storageType: storageType, symbolTag: selectedSymbol
                        }
                    }
                    const dataId = await uploadData(data, dataTag, priceInfo, window.arweaveWallet, arweave, extParam);
                    console.log(`DATAID=${dataId}`);
                    setDataId(dataId)
                    await setIsUploading(false)
                };
            }
        } catch (e) {
            console.log(e)
        } finally {
            await setPadoSdkUploading(false)
        }
    };


    function clearFile() {
        fileInputRef.current.value = '';
    }

    function handleStorageTypeChnage(value) {
        console.log('choose type:', value)
        setStorageType(value)
    }

    async function handleSymbolChange(value) {
        console.log('chose symbol', value)
        setSelectedSymbol(value)
        const balance = await getWalletBalance(value)
        console.log(balance)
        setEverpayBalance(balance)
    }


    async function submitTaskAndGetResult() {
        setTaskMsg('generate key')
        let key = await generateKey();
        // const dataInfo = await getDataById(userDataId)
        // console.log('dataInfo:',JSON.parse(JSON.parse(dataInfo).dataTag))
        setTaskMsg('submit task')
        const taskId = await submitTask(userDataId, key.pk, window.arweaveWallet);
        console.log(`TASKID=${taskId}`);
        setTaskMsg('get task result')
        const [err, data] = await getResult(taskId, key.sk).then(data => {
            setTaskMsg(null)
            return [null, data]
        }).catch(err => {
            setTaskMsg(null)
            alert(err)
            return [err, null]
        });
        console.log(`err=${err}`);
        console.log(`data=${data}`);
        //for test
        if (data) {
            downloadArrayBufferAsFile(data, 'raw_data_file')
        }
    }

    function downloadArrayBufferAsFile(data, fileName) {
        const blob = new Blob([data], {type: 'application/octet-stream'});

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    async function userDataIdChange(value) {
        console.log('dataId:', value)
        setUserDataId(value)
    }


    return (<>
        <h2>Connect Wallet</h2>
        <div className="card">
            <button disabled={cliecked} onClick={connectWallet}>
                Connect
            </button>
            <br/>
            {address && <a>{address}</a>}
            <br/>
            {arweaveBalance && <a>AR:{arweaveBalance}</a>}
        </div>
        <hr/>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between'
        }}>
            <div className="card">
                <h2>Upload File(Data Provider)</h2>
                <div>
                    storageType:<Select style={{width: '200px'}} options={storageTypeOps}
                                        onChange={handleStorageTypeChnage}
                                        defaultValue={storageType}></Select>
                </div>
                {storageType === "arseeding" && (
                    <div>
                        symbols:<Select style={{width: '200px'}} options={arseedingSymbols}
                                        defaultValue={arseedingSymbols[0]} onChange={handleSymbolChange}></Select>
                    </div>

                )
                }
                {
                    everpayBalance&&(<div>balance: {everpayBalance}</div>)
                }

                <div className="card">
                    <input type="file"
                           name="myFile"
                           ref={fileInputRef}
                           onChange={handleFileChange}/>
                    <button onClick={clearFile}>Clear file</button>
                </div>
                {isUploading && <Spin tip={'Uploading...'} size="small">Uploading</Spin>}
                {dataId && <div>DATAID: <a style={{color: 'red'}}>{dataId}</a></div>}
            </div>
            <div className="card">
                <h2>Submit Task(Data Provider)</h2>
                <input onChange={(e) => userDataIdChange(e.target.value)}/>
                {taskMsg && <Spin size="small" tip={taskMsg}>{taskMsg}</Spin>}
                <button onClick={submitTaskAndGetResult}>submitTaskAndGetResult</button>
            </div>
        </div>
        <hr/>
    </>)
}


export default App

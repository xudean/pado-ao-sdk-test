import {useCallback, useEffect, useRef, useState} from 'react'
import './App.css'
import {generateKey, getResult, submitTask, uploadData} from "@padolabs/pado-ao-sdk/";
import Arweave from "arweave";
// import {submitDataToAR} from "@xudean/pado-ao-sdk/dist/padoarweave.js";
// import { genArweaveAPI } from "arseeding-js";
import {getWalletBalance, logTokenTag, printFee, uploadDataByArseeding} from "./script/arseeding.js";
import {Input, Select, Spin} from "antd";
import {PadoNetworkContractClient, StorageType} from '@padolabs/pado-ao-sdk'

// import {Everpay} from 'everpay'
import Everpay from 'everpay'
import {ethers} from "ethers";

//import {generateKey, getResult, submitTask} from "../../../padolabs/ao/pado-ao-sdk/src/index";


function App() {
    const [cliecked, setCliecked] = useState()
    const [address, setAddress] = useState()
    const [metamaskAddress, setMetamaskAddress] = useState()
    const [fileContent, setFileContent] = useState('');
    const [storageType, setStorageType] = useState('arweave');
    const [chainName, setChainName] = useState('holesky');
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
    const supportChains = [{value: 'holesky', label: 'holesky'}, {value: 'ao', label: 'ao'}, {
        value: 'ethereum',
        label: 'ethereum'
    }]
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

    //for development,need arlocal
    const ARConfig = {
        host: '127.0.0.1',
        port: 1984,
        protocol: 'http'
    };
    //for production
    // export const ARConfig = {
    //     host: 'arweave.net',
    //     port: 443,
    //     protocol: 'https'
    // };

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

    const connectMetamask = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner()
        const address = await signer.getAddress();
        setMetamaskAddress(address);
        console.log(address)
    }

    const handleFileChange = async (event) => {
        await setIsUploading(true)
        try {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = async (e) => {
                    const content = e.target.result;
                    setFileContent(content);
                    console.log(content.byteLength);
                    console.log(content);
                    await setIsUploading(false)
                };
            }
        } catch (e) {
            console.log(e)
        } finally {
            await setPadoSdkUploading(false)
        }
    };

    async function submitData() {
        if (!fileContent) {
            throw new Error('no content');
        }
        const data = new Uint8Array(fileContent);
        // tag for the data
        let dataTag = {"testtagkey": "testtagvalue"};

        // price for the data
        let priceInfo = {price: "1", symbol: "AOCRED"};
        debugger
        //chainName will provided by caller
        const wallets = {
            wallet: window.ethereum,
            storageWallet: window.arweaveWallet
        }
        const padoNetworkClient = new PadoNetworkContractClient(chainName, storageType, wallets);

        const dataId = await padoNetworkClient.uploadData(data, dataTag, priceInfo);

        // upload your data (If you want to do a local test, refer to the README to initialize arweave and then pass it to uploadData)
        console.log(`DATAID=${dataId}`);
        setDataId(dataId)
    }


    function clearFile() {
        fileInputRef.current.value = '';
    }

    function handleStorageTypeChnage(value) {
        console.log('choose type:', value)
        setStorageType(value)
    }

    function handleChainNameChnage(value) {
        console.log('choose chain:', value)
        setChainName(value)
    }

    async function handleSymbolChange(value) {
        console.log('chose symbol', value)
        setSelectedSymbol(value)
        const balance = await getWalletBalance(value)
        console.log(balance)
        setEverpayBalance(balance)
    }


    async function submitTaskAndGetResult() {
        const wallets = {
            wallet: window.ethereum,
            storageWallet: window.arweaveWallet
        }
        const padoNetworkClient = new PadoNetworkContractClient(chainName, storageType, wallets);
        const taskId = await padoNetworkClient.submitTask('',userDataId)
        const data = await padoNetworkClient.getTaskResult(taskId);
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
                Connect ArConnect
            </button>
            <br/>
            {address && <a>{address}</a>}
            <br/>
            {arweaveBalance && <a>AR:{arweaveBalance}</a>}
        </div>
        <div className="card2">
            <button disabled={cliecked} onClick={connectMetamask}>
                Connect Metamask
            </button>
            <br/>
            {metamaskAddress && <a>{metamaskAddress}</a>}
            {/*<br/>*/}
            {/*{arweaveBalance && <a>AR:{arweaveBalance}</a>}*/}
        </div>
        <hr/>
        <h2>Choose Chain and Storage Type</h2>
        <div>
            chainName:<Select style={{width: '200px'}} options={supportChains}
                              onChange={handleChainNameChnage}
                              defaultValue={chainName}></Select>
        </div>
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
            everpayBalance && (<div>balance: {everpayBalance}</div>)
        }

        <hr/>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between'
        }}>
            <div className="card">
                <h2>Upload File(Data Provider)</h2>
                <div className="card">
                    <input type="file"
                           name="myFile"
                           ref={fileInputRef}
                           onChange={handleFileChange}/>
                    <button onClick={clearFile}>Clear file</button>
                </div>
                {isUploading && <Spin tip={'Uploading...'} size="small">Uploading</Spin>}
                {dataId && <div>DATAID: <a style={{color: 'red'}}>{dataId}</a></div>}
                <button onClick={submitData}>submitData</button>


            </div>
            <div className="card">
                <h2>Submit Task(Data User)</h2>
                <input placeholder={'dataId'} onChange={(e) => userDataIdChange(e.target.value)}/>
                {taskMsg && <Spin size="small" tip={taskMsg}>{taskMsg}</Spin>}
                <button onClick={submitTaskAndGetResult}>submitTaskAndGetResult</button>
            </div>
        </div>
        <hr/>
    </>)
}


export default App

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {uploadData, generateKey, submitTask, getResult} from "@padolabs/pado-ao-sdk";
import { genArweaveAPI } from "arseeding-js";
function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={fucUser}>
                    Connect
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}


const fuc = async () => {
    await window.arweaveWallet.connect(
        // request permissions to read the active address
        [
            "ACCESS_ADDRESS",
            "SIGN_TRANSACTION",
        ]
    );
    // const args = process.argv.slice(2)
    // if (args.length < 1) {
    //   console.log("args: <walletpath>");
    //   exit(2);
    // }
    // let walletpath = args[0];
    // console.log(`walletpath=${walletpath}`);

    // load your arweave wallet
    // const wallet = JSON.parse(readFileSync(walletpath).toString());
    const wallet = window.arweaveWallet

    // init arweave (ArLocal)
    // const arweave = Arweave.init({
    //   host: '127.0.0.1',
    //   port: 1984,
    //   protocol: 'http'
    // });


    // prepare some data
    let data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

    // tag for the data
    let dataTag = { "testtagkey": "testtagvalue" };

    // price for the data
    let priceInfo = { price: "1", symbol: "AOCRED" };

    // upload your data
    const dataId = await uploadData(data, dataTag, priceInfo, wallet);
    console.log(`DATAID=${dataId}`);
}

const fucUser = async () => {
    // const instance = await genArweaveAPI(window.arweaveWallet)
    //   console.log('instance', instance)
    let key = await generateKey();

  // submit a task to AO process
  const taskId = await submitTask("Wknf36cy0H9ksovHBbSTd-mVcpzHH7tMMrgZld2rJF4", key.pk, window.arweaveWallet);
  console.log(`TASKID=${taskId}`);

  // get the result (If you want to do a local test, refer to the README to initialize arweave and then pass it to getResult)
  const [err, data] = await getResult(taskId, key.sk).then(data => [null, data]).catch(err => [err, null]);
  console.log(`err=${err}`);
  console.log(`data=${data}`);
}


export default App

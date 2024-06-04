// import { exec } from "node:child_process"

import Arweave from "arweave"

import {
    getTokenTagByEver,
    getItemMeta,
    getBundleFee,
    InjectedArweaveSigner
} from "arseeding-js"
import {createAndSubmitItem} from "arseeding-js/cjs/submitOrder"
import {payOrder, newEverpayByRSA} from "arseeding-js/cjs/payOrder"


const arseedingUrl = "https://arseed.web3infra.dev"
console.log("arseedingUrl", arseedingUrl)

export const printFee = async (currency, bytesSize) => {
    // for (let i = 1; i <= 1024 * 1024 * 1024; i = i * 2) {
    //     const size = i.toString();
    const bundleFee = await getBundleFee(arseedingUrl, bytesSize, currency)
    console.log("size:", bytesSize, "bundleFee:", bundleFee)
    return bundleFee;
    // }
}

export const printTokenTag = async (symbol) => {
    return await getTokenTagByEver(symbol)
}

export const logTokenTag = async () => {
    const rsp1 = await printTokenTag("usdt");
    console.log(rsp1)
    const rsp2 = await printTokenTag("usdc");
    console.log(rsp2)

    const rsp3 = await printTokenTag("eth");
    console.log(rsp3)

    const rsp4 = await printTokenTag("ar");
    console.log(rsp4)

    const rsp5 = await printTokenTag("aocred");
    console.log(rsp5)

}

// npm i arseeding-js
export const uploadDataByArseeding = async (fileArrayBuffer,tag) => {
    const wallet = window.arweaveWallet;

    const signer = new InjectedArweaveSigner(wallet)
    console.log("signer", signer)
    await signer.sign(fileArrayBuffer)


    const options = {
        tags: [
            {name: "k1", value: "v1"},
            {name: "Content-Type", value: "application/octet-stream"}
            // {name: "Content-Type", value: "text/plain"}
        ]
    }
    console.log("options", options)
    console.log("tag", tag)
    // const rsp  getTokenTagByEver('ar')
    const config = {
        signer: signer,
        path: "",
        arseedUrl: arseedingUrl,
        tag: tag
    }
    console.log("config", config)
    // fileArrayBuffer = Buffer.from('This is test data!')
    const order = await createAndSubmitItem(fileArrayBuffer, options, config)
    console.log("order", order)

    return order;
    // cannot work? - you should transfer some token to everpay first.
    // const everHash = await payOrder(everpay, order)
    // console.log("everHash", everHash)
    // everHash 0x4d3f6c25217f4b047867b24991040bd10058c4a256c24de0521c15ef97a2db70
}

export const getOrderItem = async (itemId) =>{
    const itemMeta = await getItemMeta(arseedingUrl, itemId)
    console.log("itemMeta", itemMeta)
    return itemMeta;
}

export const getWalletBalance = async (tag)=>{
    // pay for the response order
    const wallet  = window.arweaveWallet;
    const arAddress = await Arweave.init({}).wallets.jwkToAddress();
    console.log("arAddress", arAddress)
    // Get all orders for address.
    // const orders = await getOrders(arseedingUrl, arAddress)
    // console.log("orders", orders)

    const everpay = newEverpayByRSA(wallet, arAddress)
    console.log("everpay", everpay)
    // const tag = "arweave,ethereum-ar-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,0x4fadc7a98f2dc96510e42dd1a74141eeae0c1543"

    const balance = await everpay.balance({
        tag: tag,
        account: arAddress
    })
    return balance;
}


/*
Download Data according to order.itemId
curl --location --request GET "https://arseed.web3infra.dev/FgwbbN03jlC_3RwyjDQ4XrW4O9a1rB3AibNGuB7aGqs"
*/
// {
//     const itemId = order.itemId
//     const cmd = `curl --location --request GET "https://arseed.web3infra.dev/${itemId}"`
//     exec(cmd, (error, stdout, stderr) => {
//         if (error) {
//             console.log(`error: ${error}`);
//             return;
//         }
//         console.log(`stdout: ${stdout}`);
//         console.log(`stderr: ${stderr}`);
//     });
// }

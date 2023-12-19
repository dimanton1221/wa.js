import Whatsapp from 'whatsapp-web.js';
// import wajes from 'whatsapp-web.js';
const { Client, RemoteAuth } = Whatsapp;
import qrcode from 'qrcode-terminal';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import qrimg from "qr-image";
// import cors from 'cors';
// make function to write qr to file in public folder berdasarkan client id
const writeQrToFile = (qr, cID) => {
    // generate png
    const qr_png = qrimg.imageSync(qr, { type: "png" });
    // write to file
    fs.writeFileSync(`public/${cID}.png`, qr_png);
}

const app = express();
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3000;
const mongo_client = await mongoose.connect(MONGO_URL, {});

// create session store
const store = new MongoStore({ mongoose: mongo_client });


const buatInst = async (cID) => {
    const client = new Client({
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy: new RemoteAuth({
            clientId: cID,
            backupSyncIntervalMs: 60000,
            store: store,
        }),
    });

    // create session
    client.initialize();

    client.on('qr', (qr) => {
        // qrcode.generate(qr, { small: true });
        writeQrToFile(qr, cID);
        console.log("BERHASIL BUAT QR" + cID)
    });

    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', + cID);
    });

    client.on("remote_session_saved", (session) => {
        console.log("REMOTE SESSION SAVED" + cID);
    });

    client.on("ready", () => {
        console.log(cID + ' is ready!');
    });


    client.on('message', async (msg) => {
        const { from, to, body } = msg;
        console.log('MESSAGE RECEIVED', from, to, body);
        const chat = await msg.getChat();
        if (body === 'ping') {
            await chat.sendMessage('pong');
        } else {
            await chat.sendMessage('not pong');
        }
        await chat.sendSeen();
        await chat.sendSeen();
    });
}



app.get('/buatInst/:client', (req, res) => {
    const client = req.params.client;
    buatInst(client);
    res.send('Instansi baru berhasil dibuat');
});

app.use("/qr", express.static('public'));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
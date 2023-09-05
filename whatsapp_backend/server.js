// importing 
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from 'cors';

// app config
const app = express();
const  port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1612277",
    key: "28fc13d182c8f943c039",
    secret: "e18f0a5e8ae179c1c235",
    cluster: "eu",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// app.use((req,res,next)=> {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', '*');
//     next();
// });

// DB config
const connection_url = 'mongodb+srv://Yashvendra:IDontKnow12@whatsapp-clone-mern.mcuzbns.mongodb.net/?retryWrites=true&w=majority';


mongoose.connect(connection_url, {

    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log("DB connected");

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("A change occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                });
        } else {
            console.log('Error triggering Pusher');
        }
    });
});

// ????

// api routes
app.get('/',(req,res) => {
    res.status(200).send('Hello world')
});

app.get('/messages/sync', async (req, res) => {
    try {
        const msg = await Messages.find();
        res.status(200).send(msg);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/messages/new', async (req, res) => {
    const dbMessage = req.body;

    try {
        const createdMessage = await Messages.create(dbMessage);
        res.status(201).send(createdMessage);
    } catch (err) {
        res.status(500).send(err);
    }
});

// listen
app.listen(port, () => {
    console.log(`Listening on localhost:${port}`)
});
require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: 'https://boardstatuschallenge.netlify.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json())

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT env variable');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

//This is an endpoint that will accept the post form the front-end.
app.post('/status', async (req, res) => {
    try {
        const { id, name, status } = req.body;
        if (!id || !name || !status) {
            return res.status(400).json({ error: 'id, name and role are required' });
        }

        const docRef = db.collection('statuses').doc(id);
        await docRef.set({
            name,
            status,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: 'User added successfully', id });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//this is and end point that will return the lates 3 to the bot.
app.get('/latest', async (req, res) => {
    try {
        const statusesRef = db.collection('statuses');
        const snapshot = await statusesRef
            .orderBy('createdAt', 'desc')  // order by timestamp descending
            .limit(3)                     // get only latest 3
            .get();

        const latestStatuses = [];
        snapshot.forEach(doc => {
            latestStatuses.push({ id: doc.id, ...doc.data() });
        });
        console.log('latestStatuses', latestStatuses);

        res.json(latestStatuses);
    } catch (error) {
        console.error('Error fetching latest statuses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/:id - fetch user document, this is the bonus that will return the 3 by the user himself.
app.get('/users/:id', async (req, res) => {
    try {
        const docRef = db.collection('users').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
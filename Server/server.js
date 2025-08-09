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


app.post('/users', async (req, res) => {
    try {
        const { id, name, role } = req.body;
        if (!id || !name || !role) {
            return res.status(400).json({ error: 'id, name and role are required' });
        }

        const docRef = db.collection('users').doc(id);
        await docRef.set({
            name,
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: 'User added successfully', id });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/:id - fetch user document
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
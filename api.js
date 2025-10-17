const express = require('express');
const bodyParser = require('body-parser');
const { getDatabase, ref, set, get, onValue } = require('firebase/database');
const firebaseConfig = require('./firebase-config');

const app = express();
const db = getDatabase(firebaseConfig);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to check in a participant
app.post('/api/checkin', async (req, res) => {
    const { registrationId } = req.body;

    if (!registrationId) {
        return res.status(400).json({ error: 'Registration ID is required' });
    }

    const regRef = ref(db, `registrations/${registrationId}`);
    const snapshot = await get(regRef);

    if (!snapshot.exists()) {
        return res.status(404).json({ error: 'Registration not found' });
    }

    const participant = snapshot.val();
    participant.checkedIn = true;

    await set(regRef, participant);
    res.json({ message: 'Checked in successfully', participant });
});

// Endpoint to get all registrations
app.get('/api/registrations', async (req, res) => {
    const regRef = ref(db, 'registrations');
    onValue(regRef, (snapshot) => {
        const registrations = [];
        snapshot.forEach((childSnapshot) => {
            registrations.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        res.json(registrations);
    });
});

// Endpoint to download attendance as CSV
app.get('/api/attendance/csv', async (req, res) => {
    const regRef = ref(db, 'registrations');
    onValue(regRef, (snapshot) => {
        let csv = 'ID,Name,Email,Event Type,CheckedIn\n';
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            csv += `${childSnapshot.key},${data.name},${data.email},${data.eventType},${data.checkedIn ? 1 : 0}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('attendance.csv');
        res.send(csv);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
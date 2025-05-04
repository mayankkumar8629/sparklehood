import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const incidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
    reported_at: { type: Date, default: Date.now }
});

const Incident = mongoose.model('Incident', incidentSchema);

mongoose.connection.once('open', async () => {
    const count = await Incident.countDocuments();
    if (count === 0) {
        await Incident.create([
            { title: 'Sample Incident 1', description: 'Description for sample 1', severity: 'Low' },
            { title: 'Sample Incident 2', description: 'Description for sample 2', severity: 'High' }
        ]);
    }
});

app.get('/incidents', async (req, res) => {
    const incidents = await Incident.find();
    res.status(200).json(incidents.map(i => ({
        id: i._id,
        title: i.title,
        description: i.description,
        severity: i.severity,
        reported_at: i.reported_at
    })));
});

app.post('/incidents', async (req, res) => {
    const { title, description, severity } = req.body;
    if (!title || !description || !severity) {
        return res.status(400).json({ error: 'Title, description, and severity are required.' });
    }
    try {
        const incident = new Incident({ title, description, severity });
        await incident.save();
        res.status(201).json({
            id: incident._id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            reported_at: incident.reported_at
        });
    } catch {
        res.status(400).json({ error: 'Invalid input or severity.' });
    }
});

app.get('/incidents/:id', async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found.' });
        }
        res.status(200).json({
            id: incident._id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            reported_at: incident.reported_at
        });
    } catch {
        res.status(400).json({ error: 'Invalid ID format.' });
    }
});

app.delete('/incidents/:id', async (req, res) => {
    try {
        const result = await Incident.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Incident not found.' });
        }
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Invalid ID format.' });
    }
});

app.listen(port, () => {
    console.log(`Incident Log API listening at http://localhost:${port}`);
});

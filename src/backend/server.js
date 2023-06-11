import express from 'express';
import cors from 'cors';
import { startBot, stopAllBrowsers, isRunning } from './bot.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

app.post('/start', async (req, res) => {
    const { url, numOfBrowsers, headless } = req.body;

    try {
        await startBot(url, numOfBrowsers, headless);
        res.send(`Bot started successfully! ${numOfBrowsers} browsers are running in ${headless ? 'headless' : 'non-headless'} mode.`);
    } catch (error) {
        res.status(500).send(`Failed to start bot: ${error.message}`);
    }
});

app.post('/stop', async (req, res) => {
    try {
        await stopAllBrowsers();
        res.send('All browsers stopped successfully!');
    } catch (error) {
        res.status(500).send(`Failed to stop browsers: ${error.message}`);
    }
});

app.post('/update', async (req, res) => {
    const { url, numOfBrowsers, headless } = req.body;
    const running = isRunning();

    try {
        // Stop all browsers
        await stopAllBrowsers();

        // Start the bot with the new settings
        if (running) {
            await startBot(url, numOfBrowsers, headless);
        }

        res.send('Bot settings updated successfully!');
    } catch (error) {
        res.status(500).send(`Failed to update bot settings: ${error.message}`);
    }
});

app.get('/status', (req, res) => {
    res.send({ running: isRunning() });
});
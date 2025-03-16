import dotenv from 'dotenv';
import express from 'express';
import * as k8s from '@kubernetes/client-node';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 

const app = express();
const http = createServer(app);
const io = new Server(http);

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();

if (process.env.MONK8S_ENVIRONMENT === 'local') {
    try {
        kc.loadFromFile(process.env.MONK8S_KUBECONFIG_PATH);
        console.log('Kubeconfig loaded from file');
    } catch (error) {
        console.error(`Error loading kubeconfig from file: ${process.env.MONK8S_KUBECONFIG_PATH}`, error);
    }
} else {
    kc.loadFromDefault(); // This will load from within the cluster
    console.log('Kubeconfig loaded from default');
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to get pod metrics
async function getPodMetrics() {
    try {
        const pods = await k8sApi.listPodForAllNamespaces();
        // The response structure is now pods.response.body.items
        const metricsData = pods.items.map(pod => ({
            name: pod.metadata.name,
            namespace: pod.metadata.namespace,
            status: pod.status.phase,
            restarts: pod.status.containerStatuses?.[0]?.restartCount || 0,
            cpu: pod?.spec?.containers[0]?.resources?.requests?.cpu || 'N/A',
            memory: pod?.spec?.containers[0]?.resources?.requests?.memory || 'N/A'
        }));
        return metricsData;
    } catch (error) {
        console.error('Error fetching pod metrics:', error);
        return [];
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Send initial metrics
    getPodMetrics().then(metrics => {
        socket.emit('metrics', metrics);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Update metrics every 30 seconds
setInterval(() => {
    getPodMetrics().then(metrics => {
        io.emit('metrics', metrics);
    });
}, 30000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
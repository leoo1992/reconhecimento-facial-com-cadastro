const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const port = 3000;
const filePath = path.join(__dirname, 'RostosConhecidos.txt');
const labels = [];
const { exec } = require('child_process');
const bodyParser = require('body-parser');
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.raw({ type: 'image/jpeg', limit: '10mb' }));

app.get('/server-ready', (req, res) => {
    res.status(200).send('Servidor pronto para recarregar.');
});

app.get('/obter-nomes', (req, res) => {
    res.json(labels);
});

const http = require('http');
const server = http.createServer(app);

server.listen(port, () => {
    console.log('Servidor rodando na porta', port);
});

let serverReady = true; // Inicialmente, o servidor está pronto

app.post('/salvar-imagem', (req, res) => {
    const nome = req.headers.nome;

    if (!nome) {
        return res.status(400).send('Nome não fornecido.');
    }

    const imageData = req.body;

    const pastaDestino = path.join(__dirname, 'assets', 'lib', 'face-api', 'labels', nome);
    if (!fs.existsSync(pastaDestino)) {
        fs.mkdirSync(pastaDestino, { recursive: true });
    }

    const caminhoImagem = path.join(pastaDestino, '1.jpg');
    fs.writeFileSync(caminhoImagem, imageData);

    fs.appendFileSync(filePath, '\n' + nome);

    res.status(200).send('Imagem e nome salvos com sucesso.');

    if (serverReady) {
        console.log('Reiniciando o servidor...');
        serverReady = false; // Impede que mais cadastros acionem reinicialização
        restartServer(); // Função para reiniciar o servidor
    }
});

function restartServer() {
    exec('npm start', (error, stdout, stderr) => {
        if (error) {
            console.error('Erro ao reiniciar o servidor:', error);
        } else {
            console.log('Servidor reiniciado com sucesso.');
            serverReady = true; // Marca o servidor como pronto após a reinicialização
        }
    });
}

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Erro ao ler o arquivo RostosConhecidos.txt:', err);
        return;
    }

    const lines = data.trim().split('\n');

    lines.forEach(line => {
        labels.push(line.trim());
    });

    console.log('Nomes carregados:', labels);
});

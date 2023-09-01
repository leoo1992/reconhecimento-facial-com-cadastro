const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

app.use(cors());

app.use(express.static('public')); // Para servir arquivos estáticos

const bodyParser = require('body-parser');
app.use(bodyParser.raw({ type: 'image/jpeg', limit: '10mb' }));

app.post('/salvar-imagem', (req, res) => {
    const nome = req.headers.nome;
    
    if (!nome) {
        return res.status(400).send('Nome não fornecido.');
    }

    const imageData = req.body;

    const pastaDestino = path.join(__dirname, 'assets', 'lib', 'face-api', 'labels', nome);
    if (!fs.existsSync(pastaDestino)){
        fs.mkdirSync(pastaDestino, { recursive: true });
    }

    const caminhoImagem = path.join(pastaDestino, '1.jpg');
    fs.writeFileSync(caminhoImagem, imageData);

    res.status(200).send('Imagem salva com sucesso.');
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

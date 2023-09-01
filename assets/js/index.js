const cam = document.getElementById('cam');
const cadastroBtn = document.getElementById('cadastroBtn');
const labels = [];

async function carregarNomes() {
    try {
        const response = await fetch('http://localhost:3000/obter-nomes');
        
        if (response.ok) {
            const nomes = await response.json();
            labels.push(...nomes);
            console.log('Nomes carregados:', labels);

        } else {
            console.error('Erro ao carregar nomes:', response.statusText);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

window.addEventListener('load', carregarNomes);

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        if (Array.isArray(devices)) {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length > 0) {
                const selectedDevice = videoDevices[0];
                navigator.getUserMedia(
                    { video: {
                        deviceId: selectedDevice.deviceId
                    }},
                    stream => {
                        if (window.camStream) {
                            window.camStream.getTracks().forEach(track => track.stop());
                        }
                        window.camStream = stream;
                        cam.srcObject = stream;
                    },
                    error => console.error(error)
                );
            } else {
                console.error("Nenhuma câmera disponível.");
            }
        }
    });
};

const loadLabels = () => {
    return Promise.all(labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 1; i++) {
            const img = await faceapi.fetchImage(`/assets/lib/face-api/labels/${label}/${i}.jpg`)
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions)
    }))
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models'),
]).then(startVideo)

cam.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(cam)
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }
    const labels = await loadLabels()
    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas)
    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(
                cam,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, canvasSize)
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6)
        const results = resizedDetections.map(d =>
            faceMatcher.findBestMatch(d.descriptor)
        )
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        results.forEach((result, index) => {
            const box = resizedDetections[index].detection.box
            const { label } = result
            new faceapi.draw.DrawTextField([
                `${label}`
            ], box.topLeft).draw(canvas)
        })
    }, 100)
})

cadastroBtn.addEventListener('click', async () => {
    const nome = document.getElementById('nomeInput').value;

    if (!nome) {
        alert('Digite um nome antes de cadastrar.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cam.videoWidth;
    canvas.height = cam.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(cam, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
        try {
            const response = await fetch('http://localhost:3000/salvar-imagem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Nome': nome
                },
                body: blob
            });

            if (response.ok) {
                alert('Foto salva com sucesso.');
                setTimeout(() => {
                    location.reload();
                }, 3000);
            } else {
                alert('Erro ao salvar a imagem.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao se comunicar com o servidor.');
        }
    }, 'image/jpeg');
});





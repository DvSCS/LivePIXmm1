// Configuração da API Gemini
const GEMINI_API_KEY = 'AIzaSyC0fL-nrkdSAjSN5yf_Dc8k7DVHzPgwr8g';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

// Sistema de prompts para doações
const systemPrompt = `A partir de agora você vai simular mandar live pix pra um streamer, tipo:
nome de quem doou = "invente um nome"
valor doado = "de 5 a 1000 reais, 5 sendo mais provavel e 1000 lendario"
conteudo da mensagem = "invente uma pergunta"
você manda 1 por vez, e so manda quando o usuario mandar a palavra chave "!"
deixe os nomes e as mensagens mais real possivel, com erros de português, trolls e tal, o streamer ta jogando roblox`;

// Função para gerar doação usando a API do Gemini
async function generateDonation() {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemPrompt + "\n!"
                    }]
                }],
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            throw new Error('Resposta inválida da API');
        }
        
        // Processa a resposta para extrair nome, valor e mensagem
        const text = data.candidates[0].content.parts[0].text;
        const matches = text.match(/Nome: (.*?)\n.*Valor: R\$ (.*?)\n.*Mensagem: "(.*?)"/s);
        
        if (!matches) {
            throw new Error('Formato de resposta inválido');
        }

        const [_, nome, valor, mensagem] = matches;
        
        // Simula a doação
        const message = {
            type: 'pix',
            nome: nome.trim(),
            valor: parseFloat(valor.replace(',', '.')).toFixed(2),
            mensagem: mensagem.trim(),
            voiceName: localStorage.getItem('selectedVoice') || '',
            timestamp: Date.now()
        };

        localStorage.setItem('pixAlert', JSON.stringify(message));
        window.dispatchEvent(new Event('pixAlertUpdate'));
        
        console.log('Auto-doação gerada:', message);
    } catch (error) {
        console.error('Erro ao gerar doação:', error);
        // Não tenta recuperar do erro, apenas para a execução
        pauseAutoDonate();
    }
}

// Controles para auto-doação
let autoDonatePaused = true;
let autoDonateInterval = null;
const INTERVAL = 10000; // 10 segundos fixos

// Função para iniciar auto-doações
function startAutoDonate() {
    if (autoDonatePaused) {
        autoDonatePaused = false;
        generateDonation(); // Gera primeira doação imediatamente
        autoDonateInterval = setInterval(() => {
            if (!autoDonatePaused) {
                generateDonation();
            }
        }, INTERVAL);
        console.log('Auto-doações iniciadas');
    }
}

// Função para pausar auto-doações
function pauseAutoDonate() {
    autoDonatePaused = true;
    if (autoDonateInterval) {
        clearInterval(autoDonateInterval);
        autoDonateInterval = null;
    }
    console.log('Auto-doações pausadas');
}

// Adiciona controles à página
function addAutoDonateControls() {
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel) {
        const autoDonateDiv = document.createElement('div');
        autoDonateDiv.className = 'auto-donate-controls';
        autoDonateDiv.innerHTML = `
            <h3>Auto-Doações (IA)</h3>
            <button id="startAutoDonate" style="background: #25D366;">Iniciar Auto-Doações</button>
            <button id="pauseAutoDonate" style="background: #dc3545;">Pausar Auto-Doações</button>
        `;
        
        controlPanel.appendChild(autoDonateDiv);
        
        document.getElementById('startAutoDonate').addEventListener('click', startAutoDonate);
        document.getElementById('pauseAutoDonate').addEventListener('click', pauseAutoDonate);
    }
}

// Inicializa os controles quando a página carregar
window.addEventListener('load', addAutoDonateControls); 
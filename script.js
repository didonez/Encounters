// --- INICIALIZAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAqE58H0UriOexZpsDAODfNFSsi5Co4nac",
    authDomain: "churrasco-com-amigosecreto.firebaseapp.com",
    projectId: "churrasco-com-amigosecreto",
    storageBucket: "churrasco-com-amigosecreto.firebasestorage.app",
    messagingSenderId: "780934998934",
    appId: "1:780934998934:web:fc30e057ef1b31b3438bb7"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); 

// --- LOCALIZAÇÃO DE ELEMENTOS HTML ---
const listaPresenca = document.getElementById('lista-presenca');
const listaAmigoSecreto = document.getElementById('lista-amigo-secreto');
const totalConfirmadosSpan = document.getElementById('total-confirmados');
const totalAmigoSecretoSpan = document.getElementById('total-amigo-secreto');

const confirmacaoForm = document.getElementById('confirmacao-form');
const nomeInput = document.getElementById('nome');
const acompanhantesInput = document.getElementById('acompanhantes');
const participaAmigoSecretoCheckbox = document.getElementById('participa-amigo-secreto');
const mensagemStatus = document.getElementById('mensagem-status');
const nomesAcompanhantesWrapper = document.getElementById('nomes-acompanhantes-wrapper');

// ⭐️ MANTIDO O ID PARA NÃO PERDER CONEXÃO ⭐️
const ID_FESTA = 'CONFRATERNIZACAO_NATAL'; 
const colecaoParticipantes = db.collection('festas').doc(ID_FESTA).collection('participantes');

// --- FUNÇÕES DE LÓGICA ---

function salvarConfirmacao(e) {
    e.preventDefault();

    mensagemStatus.textContent = "Salvando sua presença...";
    mensagemStatus.style.backgroundColor = '#fff3e0'; 
    mensagemStatus.style.color = '#e64a19'; 

    const nome = nomeInput.value.trim();
    const acompanhantes = parseInt(acompanhantesInput.value) || 0;
    const participaASPrincipal = participaAmigoSecretoCheckbox.checked;

    if (!nome) {
        exibirMensagem("Por favor, preencha seu nome.", "#ffebee", "#d32f2f");
        return;
    }

    // Coleta dados dos acompanhantes para o Amigo Secreto
    let nomesAmigoSecreto = [];
    if (participaASPrincipal) {
        nomesAmigoSecreto.push(nome);
    }
    
    const inputsAcompanhantes = nomesAcompanhantesWrapper.querySelectorAll('.acompanhante-item');
    let hasEmptyName = false;

    inputsAcompanhantes.forEach(item => {
        const nomeAcompInput = item.querySelector('input[type="text"]');
        const participaAcompCheckbox = item.querySelector('input[type="checkbox"]');
        
        const nomeAcomp = nomeAcompInput.value.trim();
        const participaAS = participaAcompCheckbox ? participaAcompCheckbox.checked : false;

        if (nomeAcomp) {
            if (participaAS) {
                nomesAmigoSecreto.push(nomeAcomp);
            }
        } else {
            hasEmptyName = true;
        }
    });
    
    if (hasEmptyName && acompanhantes > 0) {
        exibirMensagem("Preencha o nome de todos os acompanhantes.", "#ffebee", "#d32f2f");
        return;
    }

    const dados = {
        nome: nome,
        acompanhantes: acompanhantes,
        participaAS: participaASPrincipal, 
        nomesAmigoSecreto: nomesAmigoSecreto,
        valorPago: 50, // Valor padrão definido no HTML
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    colecaoParticipantes.add(dados)
        .then(() => {
            exibirMensagem("Presença confirmada! Nos vemos lá! 🥩", "#e8f5e9", "#388e3c");
            confirmacaoForm.reset();
            nomesAcompanhantesWrapper.innerHTML = '<h3>Nomes dos Acompanhantes:</h3>';
            nomesAcompanhantesWrapper.style.display = 'none';
        })
        .catch(error => {
            console.error("Erro Firestore: ", error);
            exibirMensagem("Erro ao salvar. Tente novamente.", "#ffebee", "#d32f2f");
        });
}

function exibirMensagem(texto, fundo, cor) {
    mensagemStatus.textContent = texto;
    mensagemStatus.style.backgroundColor = fundo;
    mensagemStatus.style.color = cor;
}

// --- RENDERIZAÇÃO EM TEMPO REAL ---

function renderizarListas(participantes) {
    listaPresenca.innerHTML = '';
    if (listaAmigoSecreto) listaAmigoSecreto.innerHTML = '';

    let totalPessoas = 0;
    let totalAmigoSecreto = 0;

    participantes.forEach(doc => {
        const dados = doc.data();
        const nomeParticipante = dados.nome || 'Convidado';
        const numAcompanhantes = dados.acompanhantes || 0;
        const nomesAS = dados.nomesAmigoSecreto || []; 
        
        totalPessoas += (1 + numAcompanhantes); 
        totalAmigoSecreto += nomesAS.length;

        // Lista de Presença
        const liPresenca = document.createElement('li');
        let infoExtras = nomesAS.length > 0 ? ` 🎁 (${nomesAS.length})` : '';
        liPresenca.innerHTML = `<span><strong>${nomeParticipante}</strong> +${numAcompanhantes}</span> <span>${infoExtras}</span>`;
        listaPresenca.appendChild(liPresenca);

        // Lista Amigo Secreto
        if (listaAmigoSecreto) {
            nomesAS.forEach(nomeAS => {
                const liAS = document.createElement('li');
                liAS.textContent = nomeAS; 
                listaAmigoSecreto.appendChild(liAS);
            });
        }
    });

    totalConfirmadosSpan.textContent = totalPessoas;
    if (totalAmigoSecretoSpan) totalAmigoSecretoSpan.textContent = totalAmigoSecreto;
}

function carregarParticipantes() {
    colecaoParticipantes.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        renderizarListas(snapshot.docs);
    }, error => {
        console.error("Erro snapshot: ", error);
    });
}

// --- CAMPOS DINÂMICOS ---
function gerenciarCamposAmigoSecreto() {
    nomesAcompanhantesWrapper.innerHTML = '<h3>Nomes dos Acompanhantes:</h3>';
    const numAcompanhantes = parseInt(acompanhantesInput.value) || 0;
    
    if (numAcompanhantes > 0) {
        nomesAcompanhantesWrapper.style.display = 'block';
        for (let i = 1; i <= numAcompanhantes; i++) {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('acompanhante-item');
            itemDiv.style.padding = '10px';
            itemDiv.style.borderBottom = '1px solid #eee';

            itemDiv.innerHTML = `
                <label>Nome do Acompanhante ${i}:</label>
                <input type="text" placeholder="Nome completo" required>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" id="acomp-as-${i}" style="width:auto;">
                    <label for="acomp-as-${i}" style="margin:0; font-size:0.9em;">Participa do Amigo Secreto? 🎁</label>
                </div>
            `;
            nomesAcompanhantesWrapper.appendChild(itemDiv);
        }
    } else {
        nomesAcompanhantesWrapper.style.display = 'none';
    }
}

// --- EVENTOS ---
document.addEventListener('DOMContentLoaded', carregarParticipantes);
confirmacaoForm.addEventListener('submit', salvarConfirmacao);
acompanhantesInput.addEventListener('input', gerenciarCamposAmigoSecreto);

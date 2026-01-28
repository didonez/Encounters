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

const ID_FESTA = 'CONFRATERNIZACAO_NATAL'; 
const SENHA_ADMIN = "1234"; // Defina sua senha aqui
const colecaoParticipantes = db.collection('festas').doc(ID_FESTA).collection('participantes');

const confirmacaoForm = document.getElementById('confirmacao-form');
const listaPresenca = document.getElementById('lista-presenca');
const totalConfirmadosSpan = document.getElementById('total-confirmados');
const mensagemStatus = document.getElementById('mensagem-status');

// SALVAR PRESENÇA
confirmacaoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const acompanhantes = parseInt(document.getElementById('acompanhantes').value) || 0;

    colecaoParticipantes.add({
        nome: nome,
        acompanhantes: acompanhantes,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        mensagemStatus.textContent = "Confirmado! 🥩";
        mensagemStatus.style.background = "#e8f5e9";
        confirmacaoForm.reset();
    });
});

// LER LISTA EM TEMPO REAL
colecaoParticipantes.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    listaPresenca.innerHTML = '';
    let total = 0;

    snapshot.docs.forEach(doc => {
        const d = doc.data();
        total += (1 + d.acompanhantes);

        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${d.nome}</strong> (+${d.acompanhantes})</span>
            <button class="btn-delete-small" onclick="deletarItem('${doc.id}')">×</button>
        `;
        listaPresenca.appendChild(li);
    });
    totalConfirmadosSpan.textContent = total;
});

// APAGAR UM NOME
window.deletarItem = (id) => {
    if (prompt("Senha Admin:") === SENHA_ADMIN) {
        colecaoParticipantes.doc(id).delete();
    } else {
        alert("Senha incorreta");
    }
};

// RESETAR TODA A LISTA
document.getElementById('btn-limpar-lista').addEventListener('click', () => {
    if (prompt("Digite a senha para APAGAR TUDO:") === SENHA_ADMIN) {
        colecaoParticipantes.get().then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            batch.commit().then(() => alert("Lista limpa!"));
        });
    }
});

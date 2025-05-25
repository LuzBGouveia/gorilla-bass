document.addEventListener('DOMContentLoaded', () => {
    //Elementos DOM
    const mainGorillaImg = document.getElementById('main-gorilla-img');

    const gorillaHealthProgress = document.getElementById('gorilla-health-progress');
    const gorillaHealthText = document.getElementById('gorilla-health-text');
    const gorillaEnergyProgress = document.getElementById('gorilla-energy-progress');
    const gorillaEnergyText = document.getElementById('gorilla-energy-text');
    const gorillaDefenseProgress = document.getElementById('gorilla-defense-progress');
    const gorillaDefenseText = document.getElementById('gorilla-defense-text');
    const gorillaAttacksCountText = document.getElementById('gorilla-attacks-count');

    const humansRemainingText = document.getElementById('humans-remaining-text');
    const humansGridContainer = document.getElementById('humans-grid-container');

    const attackBtn = document.getElementById('attack-btn');
    const defendBtn = document.getElementById('defend-btn');
    const resetBtn = document.getElementById('reset-btn');

    const logEntriesContainer = document.getElementById('log-entries-container');

    const gameOverSection = document.getElementById('game-over-section');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartBtn = document.getElementById('restart-btn');

    // Constantes do jogo
    const MAX_GORILLA_HEALTH = 100;
    const MAX_GORILLA_ENERGY = 50;
    const MAX_GORILLA_DEFENSE_BONUS = 30;
    const TOTAL_HUMANS = 100;

    const ATTACK_ENERGY_COST = 10;
    const DEFEND_ENERGY_COST = 15; // Custo para defender
    const DEFEND_BONUS_GAIN = 10; // Ganho de bônus de defesa
    const REST_ENERGY_GAIN = 20;  // Ganho de energia ao descansar

    const HUMANS_TO_ATTACK_MIN = 2; // Gorila ataca no mínimo X humanos
    const HUMANS_TO_ATTACK_MAX = 5; // Gorila ataca no máximo X humanos

    const HUMANS_ATTACK_POWER_MIN = 1;
    const HUMANS_ATTACK_POWER_MAX = 2;
    const HUMANS_ATTACK_CHANCE_PER_HUMAN_GROUP = 0.25; // 25% de chance de um grupo de humanos atacar
    const NUM_HUMANS_IN_ATTACKING_GROUP = 5; // Quantos humanos atacam juntos como um "grupo"

    //Variáveis de estado do jogo
    let gorillaState = {
        health: MAX_GORILLA_HEALTH,
        energy: MAX_GORILLA_ENERGY,
        defenseBonus: 0,
        attacksMade: 0
    };

    let humansArray = [];
    let humansAliveCount = TOTAL_HUMANS;

    let currentPlayerTurn = 'gorilla'; // 'gorilla' ou 'humans'
    let isAnimating = false; // Trava ações durante animações
    let isGameOver = false;

    //Inicialização do jogo
    function initializeGame() { 
        // Tenta carregar o estado salvo
        if (loadGameState()) {
            // Se carregou, verifica se o jogo já tinha acabado
            if (gorillaState.health <= 0 || humansAliveCount <= 0) {
                resetGameVariables(); // Reseta para um novo jogo se o carregado estava "game over"
            }
        } else {
            resetGameVariables(); // Se não carregou, reseta para um novo jogo
        }

        isGameOver = false; // Garante que não está game over
        currentPlayerTurn = 'gorilla';
        isAnimating = false;

        updateGorillaStatusDisplay();
        renderHumans(); // Renderiza os humanos (pode ser otimizado se já estão no DOM do save)
        updateHumansRemainingDisplay();
        clearLog();
        addLogEntry("A Batalha Começa! Turno do Gorila.", "system");
        gameOverSection.style.display = 'none';
        enableActionButtons(true);
    }

    function resetGameVariables() {
        gorillaState = {
            health: MAX_GORILLA_HEALTH,
            energy: MAX_GORILLA_ENERGY,
            defenseBonus: 0,
            attacksMade: 0
        };
        humansAliveCount = TOTAL_HUMANS;
        initializeHumansArray(); // Cria o array de humanos
    }

    function initializeHumansArray() {
        humansArray = [];
        for (let i = 0; i < TOTAL_HUMANS; i++) {
            // Cada humano é um objeto com 'id' e 'alive'
            humansArray.push({ id: i, alive: true });
        }
    }

    //Atualizações de Display
    function updateGorillaStatusDisplay() {
        gorillaHealthProgress.value = gorillaState.health;
        gorillaHealthProgress.max = MAX_GORILLA_HEALTH;
        gorillaHealthText.textContent = `${gorillaState.health}/${MAX_GORILLA_HEALTH}`;

        gorillaEnergyProgress.value = gorillaState.energy;
        gorillaEnergyProgress.max = MAX_GORILLA_ENERGY;
        gorillaEnergyText.textContent = `${gorillaState.energy}/${MAX_GORILLA_ENERGY}`;

        gorillaDefenseProgress.value = gorillaState.defenseBonus;
        gorillaDefenseProgress.max = MAX_GORILLA_DEFENSE_BONUS;
        gorillaDefenseText.textContent = `${gorillaState.defenseBonus}`;
        
        gorillaAttacksCountText.textContent = gorillaState.attacksMade;

        // Adicionar classes 'low' se necessário (requer CSS)
        gorillaHealthProgress.classList.toggle('low-health', gorillaState.health < MAX_GORILLA_HEALTH * 0.3);
        gorillaEnergyProgress.classList.toggle('low-energy', gorillaState.energy < MAX_GORILLA_ENERGY * 0.3);
    }

    function renderHumans() {
        humansGridContainer.innerHTML = ''; // Limpa a grade
        humansArray.forEach(human => {
            const humanDiv = document.createElement('div');
            humanDiv.classList.add('human'); // Classe base do seu CSS
            humanDiv.dataset.humanId = human.id; // Para identificar o humano
            if (human.alive) {
                humanDiv.classList.add('alive');
                // Adicionar imagem de humano vivo se desejar, ou deixar o CSS cuidar disso
            } else {
                humanDiv.classList.add('dead');
                // Adicionar "X" ou imagem de humano morto
            }
            humansGridContainer.appendChild(humanDiv);
        });
        updateHumansRemainingDisplay();
    }

    function updateHumansRemainingDisplay() {
        humansRemainingText.textContent = humansAliveCount;
    }

    // --- Log de Batalha ---
    function addLogEntry(message, type = "info") {
        const logEntry = document.createElement('div');
        logEntry.classList.add('log-entry'); // Classe base do seu CSS
        logEntry.classList.add(type); // Para estilização: 'gorilla', 'human', 'system'
        
        // Adicionar timestamp
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        logEntry.innerHTML = `<span>[${timestamp}]</span> ${message}`; // innerHTML para permitir spans se necessário

        logEntriesContainer.prepend(logEntry); // Adiciona no topo
        // Limitar o número de logs
        while (logEntriesContainer.children.length > 30) {
            logEntriesContainer.removeChild(logEntriesContainer.lastChild);
        }
    }
    function clearLog() {
        logEntriesContainer.innerHTML = '';
    }

    //Funções de Animação (Exemplos)
    // Estas funções agora retornam Promises para usar com async/await
    
})
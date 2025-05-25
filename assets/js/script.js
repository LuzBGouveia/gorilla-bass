document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM (CONFIRA SE CORRESPONDEM AO SEU HTML) ---
    const mainGorillaImgStatus = document.getElementById('main-gorilla-img');
    const arenaGorillaImg = document.getElementById('arena-gorilla-img');
    const arenaHumanImg = document.getElementById('arena-human-img');
    const gorillaImageToAnimate = arenaGorillaImg || mainGorillaImgStatus; // Prioriza arena

    const gorillaHealthProgress = document.getElementById('gorilla-health-progress');
    const gorillaHealthText = document.getElementById('gorilla-health-text');
    const gorillaEnergyProgress = document.getElementById('gorilla-stamina-progress');
    const gorillaEnergyText = document.getElementById('gorilla-stamina-text');
    const gorillaDefenseProgress = document.getElementById('gorilla-defense-progress');
    const gorillaDefenseText = document.getElementById('gorilla-defense-text');
    const gorillaAttacksCountText = document.getElementById('gorilla-attacks-count');

    const humansRemainingText = document.getElementById('humans-remaining-text');
    const humanRepresentativesContainer = document.getElementById('human-representatives-container');

    const attackBtn = document.getElementById('attack-btn');
    const defendBtn = document.getElementById('defend-btn');
    const restBtn = document.getElementById('rest-btn');
    const mainRestartBtn = document.getElementById('restart-btn'); // Botão nos controles

    const logEntriesContainer = document.getElementById('log-entries-container');

    const gameOverSection = document.getElementById('game-over-section');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartGameBtnGameOver = document.getElementById('restart-game-btn'); // Botão no game over

    // --- Áudio ---
    const sounds = {
        gorillaAttack: document.getElementById('sound-gorilla-attack'),
        gorillaHurt: document.getElementById('sound-gorilla-hurt'),
        humanAttack: document.getElementById('sound-human-attack'),
        humanDie: document.getElementById('sound-human-die'),
        gorillaDefend: document.getElementById('sound-gorilla-defend'),
        gorillaRest: document.getElementById('sound-gorilla-rest'),
        gameWin: document.getElementById('sound-game-win'),
        gameLose: document.getElementById('sound-game-lose')
    };

    // --- Constantes ---
    const MAX_GORILLA_HEALTH = 100, MAX_GORILLA_ENERGY = 50, MAX_GORILLA_DEFENSE_BONUS = 30;
    const TOTAL_HUMANS = 100, NUM_REPRESENTATIVE_IMAGES = 10;
    const HUMANS_PER_REPRESENTATIVE = TOTAL_HUMANS / NUM_REPRESENTATIVE_IMAGES;
    const ATTACK_ENERGY_COST = 10, DEFEND_ENERGY_COST = 15, DEFEND_BONUS_GAIN = 10, REST_ENERGY_GAIN = 20;
    const GORILLA_ATTACK_POWER_MIN = HUMANS_PER_REPRESENTATIVE * 1, GORILLA_ATTACK_POWER_MAX = HUMANS_PER_REPRESENTATIVE * 3;
    const HUMANS_ATTACK_POWER_MIN = 5, HUMANS_ATTACK_POWER_MAX = 15, HUMANS_ATTACK_CHANCE = 0.75;

    // --- Estado do Jogo ---
    let gorillaState, humansAliveCount, representativeHumans;
    let currentPlayerTurn, isAnimating, isGameOver;

    // --- Funções Auxiliares ---
    function playSound(soundElement) {
        if (soundElement && typeof soundElement.play === 'function') {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.warn("Falha ao tocar som:", soundElement.id, e));
        }
    }

    function animate(element, animationClass, duration = 500) {
        return new Promise(resolve => {
            if (!element) { resolve(); return; }
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }

    // --- Inicialização e Reset ---
    function initializeGame() {
        console.log("INIT: Iniciando jogo...");
        loadGameState(); // Tenta carregar, se falhar, resetGameVariables é chamado internamente por loadGameState ou aqui

        // Se o jogo carregado estava 'game over', loadGameState já terá chamado triggerGameOver.
        // Se não estava 'game over' ou é um novo jogo, resetamos explicitamente alguns estados de controle de turno.
        if (!isGameOver) { // Só faz isso se não estivermos já numa tela de game over vinda do load
            isGameOver = false;
            currentPlayerTurn = 'gorilla';
            isAnimating = false;
            clearLog();
            addLogEntry("A Batalha Começa! Turno do Gorila.", "system");
        }
        
        updateAllDisplays(); // Atualiza todos os displays
        if (gameOverSection) gameOverSection.style.display = isGameOver ? 'block' : 'none';
        enableActionButtons(!isGameOver); // Habilita se não for game over
        console.log("INIT: Jogo inicializado. Turno:", currentPlayerTurn, "Animating:", isAnimating, "GameOver:", isGameOver);
    }

    function resetGameVariables() {
        console.log("RESET: Resetando variáveis do jogo.");
        gorillaState = { health: MAX_GORILLA_HEALTH, stamina: MAX_GORILLA_ENERGY, defenseBonus: 0, attacksMade: 0 };
        humansAliveCount = TOTAL_HUMANS;
        representativeHumans = Array.from({ length: NUM_REPRESENTATIVE_IMAGES }, (_, i) => ({
            id: i, alive: true, health: HUMANS_PER_REPRESENTATIVE
        }));
    }
    
    function updateAllDisplays() {
        updateGorillaStatusDisplay();
        renderRepresentativeHumans();
        updateHumansRemainingDisplay();
    }

    // --- Atualizações de Display ---
    function updateGorillaStatusDisplay() {
        if (gorillaHealthProgress) gorillaHealthProgress.value = gorillaState.health;
        if (gorillaHealthText) gorillaHealthText.textContent = `${gorillaState.health}/${MAX_GORILLA_HEALTH}`;
        if (gorillaEnergyProgress) gorillaEnergyProgress.value = gorillaState.stamina;
        if (gorillaEnergyText) gorillaEnergyText.textContent = `${gorillaState.stamina}/${MAX_GORILLA_ENERGY}`;
        if (gorillaDefenseProgress) gorillaDefenseProgress.value = gorillaState.defenseBonus;
        if (gorillaDefenseText) gorillaDefenseText.textContent = `${gorillaState.defenseBonus}`;
        if (gorillaAttacksCountText) gorillaAttacksCountText.textContent = gorillaState.attacksMade;
        if (gorillaHealthProgress) gorillaHealthProgress.classList.toggle('low-health', gorillaState.health < MAX_GORILLA_HEALTH * 0.3);
        if (gorillaEnergyProgress) gorillaEnergyProgress.classList.toggle('low-stamina', gorillaState.stamina < MAX_GORILLA_ENERGY * 0.3);
    }

    function renderRepresentativeHumans() {
        if (!humanRepresentativesContainer) return;
        humanRepresentativesContainer.innerHTML = '';
        representativeHumans.forEach(rep => {
            const repImg = document.createElement('img');
            repImg.src = "./assets/img/humano.png";
            repImg.alt = `Grupo de Humanos ${rep.id + 1}`;
            repImg.classList.add('human-representative-img');
            repImg.dataset.representativeId = rep.id;
            if (!rep.alive) repImg.classList.add('defeated');
            humanRepresentativesContainer.appendChild(repImg);
        });
    }

    function updateHumansRemainingDisplay() {
        if (humansRemainingText) humansRemainingText.textContent = Math.max(0, humansAliveCount); // Garante que não seja negativo
    }

    // --- Log de Batalha ---
    function addLogEntry(message, type = "info") {
        if (!logEntriesContainer) { console.error("Elemento do Log não encontrado!"); return; }
        console.log(`LOG [${type.toUpperCase()}]: ${message}`); // Log no console para depuração

        const logEntry = document.createElement('div');
        logEntry.classList.add('log-entry', `log-entry-${type}`); // Adiciona classe base e tipo
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'log-timestamp';
        timestampSpan.textContent = `[${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }] `;
        
        logEntry.appendChild(timestampSpan);
        logEntry.appendChild(document.createTextNode(message));

        logEntriesContainer.prepend(logEntry);
        while (logEntriesContainer.children.length > 50) { // Aumentei um pouco o limite do log
            logEntriesContainer.removeChild(logEntriesContainer.lastChild);
        }
    }
    function clearLog() {
        if (logEntriesContainer) logEntriesContainer.innerHTML = '';
    }

    // --- Animações de Combate ---
    async function animateGorillaActionEffect(animationType = 'attack-animation', duration = 600) {
        if (gorillaImageToAnimate) await animate(gorillaImageToAnimate, animationType, duration);
    }
    
    async function animateRepresentativeDefeat(representativeElement) {
        if (representativeElement) {
            await animate(representativeElement, 'hit-by-gorilla', 300);
            representativeElement.classList.add('defeated');
            playSound(sounds.humanDie);
        }
    }
    
    async function animateGorillaDamageEffect(damageAmount) {
        if (gorillaImageToAnimate) await animate(gorillaImageToAnimate, 'shake', 700);
        playSound(sounds.gorillaHurt);
        if (damageAmount > 0 && gorillaImageToAnimate) {
            const parentForDamageFloat = gorillaImageToAnimate.closest('.gorilla-main-figure, .fighter') || gorillaImageToAnimate.parentElement;
            if (parentForDamageFloat) {
                parentForDamageFloat.style.position = 'relative';
                const damageTextEl = document.createElement('div');
                damageTextEl.textContent = `-${damageAmount}`;
                damageTextEl.className = 'damage-float';
                parentForDamageFloat.appendChild(damageTextEl);
                setTimeout(() => damageTextEl.remove(), 1000);
            }
        }
    }

    // --- Ações do Gorila ---
    async function handleGorillaAction(actionLogic, sound, logMessage, animation, staminaCost, passTurnArgs = [true]) {
        console.log(`ACTION: Tentando ${logMessage}. Animando: ${isAnimating}, Turno: ${currentPlayerTurn}, Energia: ${gorillaState.stamina}, Custo: ${staminaCost}`);
        if (isGameOver || isAnimating || currentPlayerTurn !== 'gorilla' || (staminaCost && gorillaState.stamina < staminaCost)) {
            if (!isAnimating && currentPlayerTurn === 'gorilla' && staminaCost && gorillaState.stamina < staminaCost) {
                addLogEntry(`Gorila com pouca energia para ${logMessage.toLowerCase().split(' ')[0]}!`, "system");
                if (gorillaImageToAnimate) await animate(gorillaImageToAnimate, 'shake', 300);
            }
            return;
        }

        isAnimating = true; // TRAVA AQUI
        enableActionButtons(false);

        if (staminaCost) {
            gorillaState.stamina -= staminaCost;
        }
        gorillaState.attacksMade += (logMessage.includes("ATAQUE") ? 1 : 0); // Só incrementa se for ataque
        updateGorillaStatusDisplay();
        playSound(sound);
        addLogEntry(logMessage, "gorilla");
        if (animation) await animateGorillaActionEffect(animation.type, animation.duration);

        await actionLogic(); // Executa a lógica específica da ação (ex: causar dano)

        // isAnimating será resetado em endHumansTurn
        endGorillaTurn(...passTurnArgs);
    }

    if (attackBtn) attackBtn.addEventListener('click', () => handleGorillaAction(
        async () => { // actionLogic
            let damageDealt = Math.floor(Math.random() * (GORILLA_ATTACK_POWER_MAX - GORILLA_ATTACK_POWER_MIN + 1)) + GORILLA_ATTACK_POWER_MIN;
            let remainingDamageToDeal = damageDealt;
            let humansDefeatedLog = 0;

            for (let rep of representativeHumans) {
                if (rep.alive && remainingDamageToDeal > 0) {
                    const damageToThisRep = Math.min(rep.health, remainingDamageToDeal);
                    rep.health -= damageToThisRep;
                    humansAliveCount -= damageToThisRep;
                    remainingDamageToDeal -= damageToThisRep;
                    humansDefeatedLog += damageToThisRep;
                    if (rep.health <= 0) {
                        rep.alive = false;
                        const repElement = humanRepresentativesContainer?.querySelector(`[data-representative-id="${rep.id}"]`);
                        if(repElement) await animateRepresentativeDefeat(repElement);
                    }
                }
            }
            humansAliveCount = Math.max(0, humansAliveCount);
            if (humansDefeatedLog > 0) addLogEntry(`Gorila ATACA e causa ${humansDefeatedLog} de "baixas"!`, "gorilla");
            else if (humansAliveCount > 0) addLogEntry("Gorila ataca, mas os humanos resistem!", "gorilla");
            updateHumansRemainingDisplay();
            renderRepresentativeHumans(); // Atualiza visual dos representantes
        },
        sounds.gorillaAttack,
        "Gorila se prepara para o ATAQUE!",
        { type: 'attack-animation', duration: 600 },
        ATTACK_ENERGY_COST
    ));

    if (defendBtn) defendBtn.addEventListener('click', () => handleGorillaAction(
        async () => { // actionLogic
            gorillaState.defenseBonus = Math.min(MAX_GORILLA_DEFENSE_BONUS, gorillaState.defenseBonus + DEFEND_BONUS_GAIN);
            updateGorillaStatusDisplay(); // Atualiza o display da defesa
             addLogEntry(`Bônus de Defesa aumentado para ${gorillaState.defenseBonus}.`, "gorilla");
        },
        sounds.gorillaDefend,
        "Gorila assume postura DEFENSIVA!",
        { type: 'defense-animation', duration: 800 },
        DEFEND_ENERGY_COST
    ));

    if (restBtn) restBtn.addEventListener('click', () => handleGorillaAction(
        async () => { // actionLogic
            const staminaGained = Math.min(REST_ENERGY_GAIN, MAX_GORILLA_ENERGY - gorillaState.stamina);
            if (staminaGained > 0) {
                gorillaState.stamina += staminaGained;
                updateGorillaStatusDisplay();
                addLogEntry(`Gorila recupera ${staminaGained} de energia. Energia atual: ${gorillaState.stamina}.`, "gorilla");
            } else {
                addLogEntry("Gorila tenta descansar, mas já está com energia máxima!", "system");
            }
        },
        sounds.gorillaRest,
        "Gorila DESCANSA...",
        { type: 'rest-animation', duration: 1000 },
        0, // Sem custo de energia para descansar
        [false] // humansShouldAttack = false
    ));

    // --- Lógica de Turno ---
    function endGorillaTurn(humansShouldAttack = true) {
        console.log(`END GORILLA TURN: humansShouldAttack: ${humansShouldAttack}. GameOver: ${isGameOver}`);
        saveGameState(); // Salva o estado após a ação do gorila
        if (checkGameEndConditions()) { // Verifica se o gorila venceu
            // isAnimating já deve ser true aqui, triggerGameOver vai setar para false.
            // enableActionButtons(false) será chamado por triggerGameOver
            return;
        }

        currentPlayerTurn = 'humans';
        addLogEntry("Turno dos Humanos...", "system");
        // enableActionButtons(false); // Já desabilitado pela ação do gorila

        if (humansShouldAttack && humansAliveCount > 0) {
            setTimeout(humansTurnAction, 1200);
        } else {
            if (humansAliveCount <= 0 && !isGameOver) { // Loga apenas se o jogo não acabou de terminar
                // Esta condição deve ser pega por checkGameEndConditions antes
            } else if (!isGameOver) {
                 addLogEntry("Humanos observam cautelosamente...", "human");
            }
            // Mesmo se não atacarem, finalizamos o ciclo para resetar flags e passar o turno
            setTimeout(endHumansTurn, 1000);
        }
    }

    async function humansTurnAction() {
        console.log("HUMANS TURN: Iniciando ação dos humanos.");
        // isAnimating já foi setado para true pela ação do gorila.

        if (isGameOver || humansAliveCount <= 0) {
            endHumansTurn(); // Leva ao reset de isAnimating e troca de turno
            return;
        }

        if (Math.random() < HUMANS_ATTACK_CHANCE) {
            playSound(sounds.humanAttack);
            addLogEntry(`Humanos se preparam para o ATAQUE!`, "human");
            if (arenaHumanImg) await animate(arenaHumanImg, 'attack-animation', 500); // Animação do humano na arena
            await new Promise(resolve => setTimeout(resolve, 1000));

            let potentialDamage = Math.floor(Math.random() * (HUMANS_ATTACK_POWER_MAX - HUMANS_ATTACK_POWER_MIN + 1)) + HUMANS_ATTACK_POWER_MIN;
            const damageAbsorbed = Math.min(potentialDamage, gorillaState.defenseBonus);
            const damageTaken = Math.max(0, potentialDamage - gorillaState.defenseBonus);

            gorillaState.health = Math.max(0, gorillaState.health - damageTaken);
            
            if (damageTaken > 0) {
                addLogEntry(`Gorila é atingido e sofre ${damageTaken} de dano! (Defendido: ${damageAbsorbed})`, "human");
                await animateGorillaDamageEffect(damageTaken);
            } else if (potentialDamage > 0) {
                addLogEntry("O ataque dos humanos é totalmente bloqueado pela defesa do Gorila!", "human");
                if(gorillaImageToAnimate) await animate(gorillaImageToAnimate, 'defense-success-animation', 600);
            } else {
                addLogEntry("Humanos tentam um ataque, mas falham em causar impacto!", "human");
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            updateGorillaStatusDisplay();

            if (gorillaState.defenseBonus > 0 && damageAbsorbed > 0) {
                gorillaState.defenseBonus = Math.max(0, gorillaState.defenseBonus - Math.ceil(DEFEND_BONUS_GAIN / 3));
                addLogEntry("A defesa bônus do Gorila enfraquece.", "system");
                updateGorillaStatusDisplay();
            }
        } else {
            addLogEntry("Humanos hesitam e decidem não atacar desta vez.", "human");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        endHumansTurn(); // Finaliza o turno dos humanos e reseta isAnimating
    }

    function endHumansTurn() {
        console.log("END HUMANS TURN: Finalizando turno dos humanos.");
        isAnimating = false; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< PONTO CRÍTICO PARA DESTRAVAR
        saveGameState(); // Salva o estado após o turno dos humanos
        
        if (checkGameEndConditions()) { // Verifica se os humanos venceram
            enableActionButtons(false); // Garante que os botões fiquem desabilitados
            return;
        }
        
        currentPlayerTurn = 'gorilla';
        addLogEntry("Turno do Gorila! Prepare sua ação.", "system");
        enableActionButtons(true); // Reabilita botões para o gorila
        console.log("END HUMANS TURN: Próximo turno do Gorila. Animating:", isAnimating);
    }

    // --- Fim de Jogo e Reinício ---
    function checkGameEndConditions() {
        if (isGameOver) return true;
        if (gorillaState.health <= 0) {
            triggerGameOver("Os humanos venceram! O Gorila foi derrotado.", sounds.gameLose); return true;
        }
        if (humansAliveCount <= 0) {
            triggerGameOver("O Gorila venceu! Todos os humanos foram eliminados.", sounds.gameWin); return true;
        }
        return false;
    }

    function triggerGameOver(message, soundToPlay) {
        if(isGameOver) return; 
        // console.log("GAME OVER:", message);
        isGameOver = true;
        isAnimating = false; 
        currentPlayerTurn = 'none';
        enableActionButtons(false);
        
        playSound(soundToPlay);
        if (gameOverMessage) gameOverMessage.textContent = message;
        if (gameOverSection) gameOverSection.style.display = 'block';
        addLogEntry(message, "system end-game-message");
        saveGameState(); 
    }
    
    function fullGameRestart(){
        console.log("RESTART: Reiniciando o jogo completamente.");
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Garante que o save anterior seja limpo para um reset total
        
        // Força o reset de todas as variáveis de controle de estado ANTES de chamar initializeGame
        isGameOver = false;
        isAnimating = false;
        currentPlayerTurn = undefined; // Para que initializeGame saiba que é um novo começo
        resetGameVariables(); // Reseta os dados do jogo (vida, energia, humanos)
        
        // Agora chama initializeGame, que irá configurar o resto (log, UI, etc.)
        initializeGame();
    }

    if (restartGameBtnGameOver) restartGameBtnGameOver.addEventListener('click', fullGameRestart);
    if (mainRestartBtn) mainRestartBtn.addEventListener('click', fullGameRestart);

    function enableActionButtons(enable) {
        const canInteract = enable && !isAnimating && currentPlayerTurn === 'gorilla' && !isGameOver;
        console.log(`UI: enableActionButtons(${enable}) -> canInteract: ${canInteract} (isAnimating: ${isAnimating}, turn: ${currentPlayerTurn}, gameOver: ${isGameOver})`);
        
        if(attackBtn) attackBtn.disabled = !canInteract;
        if(defendBtn) defendBtn.disabled = !canInteract;
        if(restBtn) restBtn.disabled = !canInteract;
        if(mainRestartBtn) mainRestartBtn.disabled = isAnimating; // Botão de reiniciar principal pode ser desabilitado durante animações
    }
    
    // --- LocalStorage ---
    const LOCAL_STORAGE_KEY = 'gorillaBassGameState_v4'; // Nova versão
    function saveGameState() {
        const gameStateToSave = {
            gorillaState, representativeHumans, humansAliveCount, isGameOver
        };
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameStateToSave));
            console.log("GAME SAVED. GameOver state:", isGameOver);
        } catch (e) {
            console.error("Erro ao salvar:", e); addLogEntry("Erro ao salvar jogo.", "error");
        }
    }

    function loadGameState() {
        const savedGameString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!savedGameString) {
            console.log("LOAD: Nenhum save encontrado, resetando variáveis.");
            resetGameVariables(); // Se não há save, reseta para o padrão ANTES de initializeGame
            return false; // Indica que não carregou, mas resetou para um novo jogo
        }

        try {
            const loadedState = JSON.parse(savedGameString);
            if (loadedState && loadedState.gorillaState && loadedState.representativeHumans && typeof loadedState.humansAliveCount === 'number') {
                gorillaState = loadedState.gorillaState;
                representativeHumans = loadedState.representativeHumans;
                humansAliveCount = loadedState.humansAliveCount;
                isGameOver = loadedState.isGameOver || false; // Carrega o estado de game over
                
                // Ajustes para garantir consistência com as constantes atuais do jogo
                gorillaState.health = Math.min(gorillaState.health, MAX_GORILLA_HEALTH);
                gorillaState.stamina = Math.min(gorillaState.stamina, MAX_GORILLA_ENERGY);

                addLogEntry("Jogo anterior carregado!", "system");
                console.log("LOAD: Jogo carregado. GameOver:", isGameOver);

                if (isGameOver) {
                    // Não chama initializeGame(), apenas configura a tela de fim de jogo.
                    // A mensagem e som já devem ter sido salvos ou podem ser deduzidos.
                    let msg = gorillaState.health <= 0 ? "Os humanos venceram! O Gorila foi derrotado." : "O Gorila venceu! Todos os humanos foram eliminados.";
                    let sound = gorillaState.health <= 0 ? sounds.gameLose : sounds.gameWin;
                    // Chamamos triggerGameOver aqui para mostrar a tela, mas sem tocar o som novamente se já tocou.
                    // Para simplificar, vamos deixar triggerGameOver tocar o som, mas o ideal seria não se o estado já é game over.
                    // Por ora, vamos direto para configurar a UI de game over.
                    if (gameOverMessage) gameOverMessage.textContent = msg;
                    if (gameOverSection) gameOverSection.style.display = 'block';
                    enableActionButtons(false); // Garante que os botões de ação estão desabilitados
                }
                return true; // Indica que carregou com sucesso
            }
        } catch (e) { /* ... */ }
        
        console.warn("LOAD: Falha ao carregar/parsear save. Resetando variáveis.");
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        resetGameVariables(); // Se o save é inválido, reseta
        return false; // Indica que o save falhou
    }

    // --- Iniciar o Jogo ---
    initializeGame();
});
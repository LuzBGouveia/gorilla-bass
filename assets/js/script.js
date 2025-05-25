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

    

    
})
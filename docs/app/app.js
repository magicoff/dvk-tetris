/**
 * @fileoverview Tetris - Pure ASCII Text Mode Engine
 * Единый дисплей 80x24 символа с текстовой графикой
 * @version 2.0
 * @author AI Assistant
 */

/**
 * Основной объект игры Tetris
 * @namespace
 */
const Tetris = {
    /**
     * Константы игры
     * @enum {number}
     */
    CONSTANTS: {
        /** Количество колонок в игровом поле */
        COLS: 10,
        /** Количество строк в игровом поле */
        ROWS: 20,
        /** Ширина дисплея в символах */
        DISPLAY_WIDTH: 80,
        /** Высота дисплея в символах */
        DISPLAY_HEIGHT: 24,
        /** Пустая ячейка (пробел + точка) */
        EMPTY_CELL: ' .',
        /** Заполненная ячейка (квадратные скобки) */
        FILLED_CELL: '[]',
        /** Базовая скорость падения (мс) */
        BASE_DROP_SPEED: 1000,
        /** Минимальная скорость падения (мс) */
        MIN_DROP_SPEED: 100,
        /** Смещение стакана по горизонтали */
        CUP_OFFSET: 28,
        /** Отступ подсказок от правой стенки стакана */
        HINTS_OFFSET_FROM_CUP: 3,
        /** Номер строки начала информации слева */
        INFO_START_ROW: 1,
        /** Номер строки начала превью следующей фигуры */
        NEXT_PIECE_START_ROW: 10,
        /** Номер строки начала подсказок управления */
        CONTROLS_START_ROW: 1,
        /** Период мигания курсора (мс) */
        CURSOR_BLINK_PERIOD: 500,
        /** Время последнего обновления курсора */
        CURSOR_LAST_UPDATE: 0,
        /** Ширина стакана в символах (стенки + поле) */
        CUP_WIDTH: 24
    },

    /**
     * Фигуры (тетромино) - матрицы 4x4
     * @type {Object.<string, {shape: number[][]}>}
     */
    TETROMINOS: {
        I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]] },
        J: { shape: [[1,0,0], [1,1,1], [0,0,0]] },
        L: { shape: [[0,0,1], [1,1,1], [0,0,0]] },
        O: { shape: [[1,1], [1,1]] },
        S: { shape: [[0,1,1], [1,1,0], [0,0,0]] },
        T: { shape: [[0,1,0], [1,1,1], [0,0,0]] },
        Z: { shape: [[1,1,0], [0,1,1], [0,0,0]] }
    },

    /**
     * Состояние игры
     * @type {Object}
     * @property {number[][]} board - Игровое поле
     * @property {Object|null} currentPiece - Текущая фигура
     * @property {Object|null} nextPiece - Следующая фигура
     * @property {number} score - Текущий счёт
     * @property {number} highScore - Рекорд
     * @property {number} level - Текущий уровень
     * @property {number} lines - Количество очищенных линий
     * @property {boolean} isPlaying - Игра активна
     * @property {boolean} isPaused - Игра на паузе
     * @property {boolean} isGameOver - Игра окончена
     * @property {number|null} dropInterval - Интервал падения
     * @property {number} dropSpeed - Скорость падения (мс)
     * @property {boolean} showHints - Показывать подсказки по управлению
     * @property {boolean} showControls - Показывать легенду управления
     */
    state: {
        board: null,
        currentPiece: null,
        nextPiece: null,
        score: 0,
        highScore: 0,
        level: 1,
        lines: 0,
        isPlaying: false,
        isPaused: false,
        isGameOver: false,
        dropInterval: null,
        dropSpeed: 1000,
        showHints: true,
        showControls: true
    },

    /**
     * DOM элементы
     * @type {Object}
     * @property {HTMLElement|null} display - Основной дисплей
     */
    elements: {
        display: null
    },

    /**
     * Мешок фигур для генерации (7-bag system)
     * @type {string[]}
     */
    bag: [],

    /**
     * Подсказки по управлению (справа от стакана)
     * @type {string[]}
     */
    controlHints: [
        '7:ЛЕВО   9:ПРАВО',
        '8:ПОВОРОТ',
        '4:ВНИЗ   5:СБРОС',
        '1:ПОКАЗАТЬ СЛЕДУЮЩ',
        '0:СКРЫТЬ ЭТОТ ТЕКСТ',
        'ПРОБЕЛ — СБРОС'
    ],

    /**
     * Инициализация игры
     * @function
     * @memberof Tetris
     * @listens DOMContentLoaded
     * @listens keydown
     */
    init() {
        this.elements.display = document.getElementById('display');

        // Загрузка рекорда из localStorage
        this.state.highScore = parseInt(localStorage.getItem('tetrisHighScore') || '0', 10);
        
        this.resetGame();
        this.startGame();
        
        document.addEventListener('keydown', this.handleInput.bind(this));
    },

    /**
     * Создание пустого игрового поля
     * @function
     * @memberof Tetris
     * @returns {number[][]} Двумерный массив поля ROWS×COLS
     */
    createBoard() {
        return Array.from({ length: this.CONSTANTS.ROWS }, () => 
            Array(this.CONSTANTS.COLS).fill(0)
        );
    },

    /**
     * Генератор следующей фигуры (7-bag system)
     * @function
     * @memberof Tetris
     * @returns {Object} Объект фигуры с матрицей и позицией
     */
    getNextTetromino() {
        if (this.bag.length === 0) {
            this.bag = Object.keys(this.TETROMINOS);
            // Перемешивание (алгоритм Фишера-Йетса)
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        const key = this.bag.pop();
        return {
            shape: this.TETROMINOS[key].shape.map(row => [...row]),
            row: 0,
            col: Math.floor(this.CONSTANTS.COLS / 2) - 
                 Math.floor(this.TETROMINOS[key].shape[0].length / 2)
        };
    },

    /**
     * Запуск игры
     * @function
     * @memberof Tetris
     */
    startGame() {
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.dropSpeed = this.CONSTANTS.BASE_DROP_SPEED;
        
        this.state.nextPiece = this.getNextTetromino();
        this.spawnPiece();
        
        this.startDropLoop();
    },

    /**
     * Запуск цикла падения фигуры
     * @function
     * @memberof Tetris
     */
    startDropLoop() {
        if (this.state.dropInterval) {
            clearInterval(this.state.dropInterval);
        }
        this.state.dropInterval = setInterval(() => {
            if (this.state.isPlaying && !this.state.isPaused && !this.state.isGameOver) {
                this.drop();
            }
        }, this.state.dropSpeed);
    },

    /**
     * Остановка цикла падения
     * @function
     * @memberof Tetris
     */
    stopDropLoop() {
        if (this.state.dropInterval) {
            clearInterval(this.state.dropInterval);
            this.state.dropInterval = null;
        }
    },

    /**
     * Спавн новой фигуры
     * @function
     * @memberof Tetris
     */
    spawnPiece() {
        this.state.currentPiece = this.state.nextPiece;
        this.state.nextPiece = this.getNextTetromino();
        
        // Центрирование фигуры
        this.state.currentPiece.col = Math.floor(this.CONSTANTS.COLS / 2) - 
            Math.floor(this.getPieceWidth(this.state.currentPiece.shape) / 2);
        this.state.currentPiece.row = 0;
        
        // Проверка на проигрыш
        if (this.checkCollision(
            this.state.currentPiece.shape, 
            this.state.currentPiece.row, 
            this.state.currentPiece.col
        )) {
            this.gameOver();
            return;
        }
        
        this.render();
    },

    /**
     * Получение ширины фигуры
     * @function
     * @memberof Tetris
     * @param {number[][]} shape - Матрица фигуры
     * @returns {number} Ширина фигуры
     */
    getPieceWidth(shape) {
        return shape[0].length;
    },

    /**
     * Проверка столкновений
     * @function
     * @memberof Tetris
     * @param {number[][]} shape - Матрица фигуры
     * @param {number} offsetRow - Смещение по вертикали
     * @param {number} offsetCol - Смещение по горизонтали
     * @returns {boolean} true при наличии столкновения
     */
    checkCollision(shape, offsetRow, offsetCol) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const newRow = offsetRow + row;
                    const newCol = offsetCol + col;
                    
                    // Выход за границы
                    if (newRow < 0 || newRow >= this.CONSTANTS.ROWS || 
                        newCol < 0 || newCol >= this.CONSTANTS.COLS) {
                        return true;
                    }
                    
                    // Столкновение с застывшими фигурами
                    if (this.state.board[newRow][newCol] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    /**
     * Падение фигуры вниз
     * @function
     * @memberof Tetris
     */
    drop() {
        if (!this.state.currentPiece || this.state.isPaused || this.state.isGameOver) return;
        
        const newRow = this.state.currentPiece.row + 1;
        
        if (this.checkCollision(
            this.state.currentPiece.shape, 
            newRow, 
            this.state.currentPiece.col
        )) {
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        } else {
            this.state.currentPiece.row = newRow;
            this.render();
        }
    },

    /**
     * Перемещение влево
     * @function
     * @memberof Tetris
     */
    moveLeft() {
        if (!this.state.currentPiece || this.state.isPaused || this.state.isGameOver) return;
        
        const newCol = this.state.currentPiece.col - 1;
        if (!this.checkCollision(
            this.state.currentPiece.shape, 
            this.state.currentPiece.row, 
            newCol
        )) {
            this.state.currentPiece.col = newCol;
            this.render();
        }
    },

    /**
     * Перемещение вправо
     * @function
     * @memberof Tetris
     */
    moveRight() {
        if (!this.state.currentPiece || this.state.isPaused || this.state.isGameOver) return;
        
        const newCol = this.state.currentPiece.col + 1;
        if (!this.checkCollision(
            this.state.currentPiece.shape, 
            this.state.currentPiece.row, 
            newCol
        )) {
            this.state.currentPiece.col = newCol;
            this.render();
        }
    },

    /**
     * Поворот фигуры
     * @function
     * @memberof Tetris
     * @uses Tetris.rotateShape
     * @uses Tetris.checkCollision
     */
    rotate() {
        if (!this.state.currentPiece || this.state.isPaused || this.state.isGameOver) return;
        
        const originalShape = this.state.currentPiece.shape;
        const rotated = this.rotateShape(originalShape);
        
        // Проверка поворота на месте
        if (!this.checkCollision(rotated, this.state.currentPiece.row, this.state.currentPiece.col)) {
            this.state.currentPiece.shape = rotated;
            this.render();
            return;
        }
        
        // Wall kick - попытка сдвига
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (!this.checkCollision(
                rotated, 
                this.state.currentPiece.row, 
                this.state.currentPiece.col + kick
            )) {
                this.state.currentPiece.shape = rotated;
                this.state.currentPiece.col += kick;
                this.render();
                return;
            }
        }
    },

    /**
     * Поворот матрицы фигуры на 90°
     * @function
     * @memberof Tetris
     * @param {number[][]} shape - Исходная матрица
     * @returns {number[][]} Повёрнутая матрица
     */
    rotateShape(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                rotated[col][rows - 1 - row] = shape[row][col];
            }
        }
        
        return rotated;
    },

    /**
     * Мгновенное падение (hard drop)
     * @function
     * @memberof Tetris
     */
    hardDrop() {
        if (!this.state.currentPiece || this.state.isPaused || this.state.isGameOver) return;
        
        let dropDistance = 0;
        while (!this.checkCollision(
            this.state.currentPiece.shape, 
            this.state.currentPiece.row + 1, 
            this.state.currentPiece.col
        )) {
            this.state.currentPiece.row++;
            dropDistance++;
        }
        
        this.state.score += dropDistance * 2;
        
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
    },

    /**
     * Мягкое падение (soft drop)
     * @function
     * @memberof Tetris
     */
    softDrop() {
        if (!this.state.currentPiece || this.state.isPaused || this.state.isGameOver) return;
        
        if (!this.checkCollision(
            this.state.currentPiece.shape, 
            this.state.currentPiece.row + 1, 
            this.state.currentPiece.col
        )) {
            this.state.currentPiece.row++;
            this.state.score += 1;
            this.render();
        }
    },

    /**
     * Фиксация фигуры на поле
     * @function
     * @memberof Tetris
     */
    lockPiece() {
        const { shape, row, col } = this.state.currentPiece;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const boardRow = row + r;
                    const boardCol = col + c;
                    if (boardRow >= 0 && boardRow < this.CONSTANTS.ROWS && 
                        boardCol >= 0 && boardCol < this.CONSTANTS.COLS) {
                        this.state.board[boardRow][boardCol] = 1;
                    }
                }
            }
        }
    },

    /**
     * Очистка заполненных линий
     * @function
     * @memberof Tetris
     * @fires Tetris.increaseSpeed - При повышении уровня
     */
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.CONSTANTS.ROWS - 1; row >= 0; row--) {
            if (this.state.board[row].every(cell => cell !== 0)) {
                this.state.board.splice(row, 1);
                this.state.board.unshift(Array(this.CONSTANTS.COLS).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            // Очки за линии: 100, 300, 500, 800
            const points = [0, 100, 300, 500, 800];
            this.state.score += points[linesCleared] * this.state.level;
            this.state.lines += linesCleared;
            
            // Повышение уровня каждые 10 линий
            const newLevel = Math.floor(this.state.lines / 10) + 1;
            if (newLevel > this.state.level) {
                this.state.level = newLevel;
                this.increaseSpeed();
            }
            
            // Обновление рекорда
            if (this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
                localStorage.setItem('tetrisHighScore', this.state.highScore.toString());
            }
        }
    },

    /**
     * Увеличение скорости падения
     * @function
     * @memberof Tetris
     */
    increaseSpeed() {
        this.state.dropSpeed = Math.max(
            this.CONSTANTS.MIN_DROP_SPEED, 
            this.CONSTANTS.BASE_DROP_SPEED - (this.state.level - 1) * 100
        );
        this.startDropLoop();
    },

    /**
     * Рендеринг дисплея 80x24
     * @function
     * @memberof Tetris
     * @description Отрисовка игрового поля, информации и следующей фигуры
     */
    render() {
        const {
            ROWS, COLS, DISPLAY_WIDTH, DISPLAY_HEIGHT,
            EMPTY_CELL, FILLED_CELL, CUP_OFFSET, CUP_WIDTH,
            HINTS_OFFSET_FROM_CUP, INFO_START_ROW,
            NEXT_PIECE_START_ROW, CONTROLS_START_ROW
        } = this.CONSTANTS;

        // Копия доски для рендера
        const renderBoard = this.state.board.map(row => [...row]);

        // Рисуем текущую фигуру
        if (this.state.currentPiece) {
            const { shape, row, col } = this.state.currentPiece;
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] === 1) {
                        const boardRow = row + r;
                        const boardCol = col + c;
                        if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                            renderBoard[boardRow][boardCol] = 1;
                        }
                    }
                }
            }
        }

        // Создаём пустой дисплей
        const display = Array.from({ length: DISPLAY_HEIGHT }, () =>
            Array(DISPLAY_WIDTH).fill(' ')
        );

        // Рендеринг стакана (сдвинуто на одну строку вниз)
        for (let row = 0; row < ROWS; row++) {
            // Левая стенка
            display[row + 1][CUP_OFFSET] = '<';
            display[row + 1][CUP_OFFSET + 1] = '!';

            // Игровое поле
            for (let col = 0; col < COLS; col++) {
                const cellChar = renderBoard[row][col] === 1 ? FILLED_CELL : EMPTY_CELL;
                display[row + 1][CUP_OFFSET + 2 + col * 2] = cellChar[0];
                display[row + 1][CUP_OFFSET + 2 + col * 2 + 1] = cellChar[1];
            }

            // Правая стенка
            display[row + 1][CUP_OFFSET + CUP_WIDTH - 2] = '!';
            display[row + 1][CUP_OFFSET + CUP_WIDTH - 1] = '>';
        }

        // Дно - первая строка
        const bottomRow1 = ROWS + 1;
        display[bottomRow1][CUP_OFFSET] = '<';
        display[bottomRow1][CUP_OFFSET + 1] = '!';
        for (let i = 0; i < COLS; i++) {
            display[bottomRow1][CUP_OFFSET + 2 + i * 2] = '=';
            display[bottomRow1][CUP_OFFSET + 2 + i * 2 + 1] = '=';
        }
        display[bottomRow1][CUP_OFFSET + CUP_WIDTH - 2] = '!';
        display[bottomRow1][CUP_OFFSET + CUP_WIDTH - 1] = '>';

        // Дно - вторая строка (\/)
        const bottomRow2 = ROWS + 2;
        for (let i = 0; i < COLS; i++) {
            display[bottomRow2][CUP_OFFSET + 2 + i * 2] = '\\';
            display[bottomRow2][CUP_OFFSET + 2 + i * 2 + 1] = '/';
        }

        // Мигающий курсор в позиции 0,0
        const cursor = (Date.now() % 1000) < 500 ? '_' : ' ';
        display[0][0] = cursor;

        // Информация (строки 1-3)
        const infoLines = `КОЛИЧ СТРОК: ${this.state.lines}`;
        const infoLevel = `УРОВЕНЬ:     ${this.state.level}`;
        const infoScore = `СЧЕТ:        ${this.state.score}`;

        const infoOffset = 1;

        for (let i = 0; i < infoLines.length && infoOffset + i < CUP_OFFSET; i++) {
            display[INFO_START_ROW][infoOffset + i] = infoLines[i];
        }

        for (let i = 0; i < infoLevel.length && infoOffset + i < CUP_OFFSET; i++) {
            display[INFO_START_ROW + 1][infoOffset + i] = infoLevel[i];
        }
        for (let i = 0; i < infoScore.length && infoOffset + i < CUP_OFFSET; i++) {
            display[INFO_START_ROW + 2][infoOffset + i] = infoScore[i];
        }

        // Следующая фигура
        if (this.state.nextPiece && this.state.showHints) {
            const shape = this.state.nextPiece.shape;
            const nextCol = CUP_OFFSET - 9;

            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] === 1) {
                        const displayRow = NEXT_PIECE_START_ROW + r;
                        const displayCol = nextCol + c * 2;
                        if (displayRow < DISPLAY_HEIGHT && displayCol + 1 < DISPLAY_WIDTH) {
                            display[displayRow][displayCol] = FILLED_CELL[0];
                            display[displayRow][displayCol + 1] = FILLED_CELL[1];
                        }
                    }
                }
            }
        }

        // Подсказки по управлению (справа от стакана)
        if (this.state.showControls) {
            const hintsOffset = CUP_OFFSET + CUP_WIDTH - 1 + HINTS_OFFSET_FROM_CUP;

            this.controlHints.forEach((hint, index) => {
                const row = CONTROLS_START_ROW + index;
                if (row < DISPLAY_HEIGHT) {
                    for (let i = 0; i < hint.length && hintsOffset + i < DISPLAY_WIDTH; i++) {
                        display[row][hintsOffset + i] = hint[i];
                    }
                }
            });
        }

        // Вывод на дисплей
        let output = '';
        for (let row = 0; row < DISPLAY_HEIGHT; row++) {
            output += display[row].join('') + '\n';
        }

        this.elements.display.textContent = output;
    },

    /**
     * Обработка ввода с клавиатуры
     * @function
     * @memberof Tetris
     * @param {KeyboardEvent} event - Событие клавиатуры
     * @listens keydown
     */
    handleInput(event) {
        // Рестарт после Game Over
        if (this.state.isGameOver) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.resetGame();
                this.startGame();
            }
            return;
        }
        
        // Цифровые клавиши для управления подсказками
        if (event.key === '0') {
            event.preventDefault();
            this.state.showControls = !this.state.showControls;
            this.render();
            return;
        }
        
        if (event.key === '1') {
            event.preventDefault();
            this.state.showHints = !this.state.showHints;
            this.render();
            return;
        }
        
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.moveLeft();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.moveRight();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.softDrop();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.rotate();
                break;
            case ' ':
                event.preventDefault();
                this.hardDrop();
                break;
            case 'p':
            case 'P':
            case 'Escape':
                event.preventDefault();
                this.togglePause();
                break;
            case 'r':
            case 'R':
                event.preventDefault();
                this.resetGame();
                this.startGame();
                break;
        }
    },

    /**
     * Переключение паузы
     * @function
     * @memberof Tetris
     */
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        
        if (this.state.isPaused) {
            this.showOverlay('PAUSED', 'Press P or ESC to RESUME');
        } else {
            this.hideOverlay();
        }
    },

    /**
     * Показ оверлея
     * @function
     * @memberof Tetris
     * @param {string} title - Заголовок
     * @param {string} subtitle - Подзаголовок
     */
    showOverlay(title, subtitle) {
        this.hideOverlay();

        const overlay = document.createElement('div');
        overlay.id = 'game-overlay';

        const titleEl = document.createElement('div');
        titleEl.textContent = title;

        const subtitleEl = document.createElement('div');
        subtitleEl.textContent = subtitle;

        overlay.appendChild(titleEl);
        overlay.appendChild(subtitleEl);

        document.querySelector('.game-container').appendChild(overlay);
    },

    /**
     * Скрытие оверлея
     * @function
     * @memberof Tetris
     */
    hideOverlay() {
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Конец игры
     * @function
     * @memberof Tetris
     */
    gameOver() {
        this.state.isGameOver = true;
        this.state.isPlaying = false;
        this.stopDropLoop();
        
        this.showOverlay('GAME OVER', `FINAL SCORE: ${this.state.score}\nPress ENTER or SPACE to restart`);
    },

    /**
     * Сброс игры
     * @function
     * @memberof Tetris
     */
    resetGame() {
        this.stopDropLoop();
        this.state.board = this.createBoard();
        this.state.score = 0;
        this.state.level = 1;
        this.state.lines = 0;
        this.state.dropSpeed = this.CONSTANTS.BASE_DROP_SPEED;
        this.state.isGameOver = false;
        this.state.isPaused = false;
        this.state.currentPiece = null;
        this.state.nextPiece = null;
        this.bag = [];

        this.render();
        this.hideOverlay();
    }
};

// Запуск игры при загрузке DOM
document.addEventListener('DOMContentLoaded', () => Tetris.init());

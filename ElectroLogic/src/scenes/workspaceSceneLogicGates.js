import Phaser from 'phaser';
import LabScene from './labScene';
import { LogicCircuit, GateTypes } from '../logic/logic_gates';

export default class WorkspaceSceneLogicGates extends Phaser.Scene {
    constructor() {
        super('workspaceSceneLogicGates');
    }

    init() {
        this.logicCircuit = new LogicCircuit();
        this.currentChallengeIndex = 0;
    }

    preload() {
        this.load.image('AND', 'src/components/logic_gates/AND.png');
        this.load.image('BULB', 'src/components/logic_gates/BULB.png');
        this.load.image('NAND', 'src/components/logic_gates/NAND.png');
        this.load.image('NOR', 'src/components/logic_gates/NOR.png');
        this.load.image('OR', 'src/components/logic_gates/OR.png');
        this.load.image('SWITCH_OFF', 'src/components/logic_gates/SWITCH_OFF.png');
        this.load.image('SWITCH_ON', 'src/components/logic_gates/SWITCH_ON.png');
        this.load.image('XNOR', 'src/components/logic_gates/XNOR.png');
        this.load.image('XOR', 'src/components/logic_gates/XOR.png');
        this.load.image('NOT', 'src/components/logic_gates/NOT.png');
    }

    create() {
        this.input.mouse.disableContextMenu();

        const { width, height } = this.cameras.main;
        this.gridSize = 40;
        this.cameras.main.roundPixels = true;
        this.add.rectangle(0, 0, width, height, 0xe0c9a6).setOrigin(0);
        this.createGrid();
        const panelWidth = 200;
        this.add.rectangle(0, 0, panelWidth, height, 0xc0c0c0).setOrigin(0);
        this.add.rectangle(0, 0, panelWidth, height, 0x000000, 0.2).setOrigin(0);
        this.add.text(panelWidth / 2, 60, 'Logični elementi', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        const types = [
            { key: 'input', label: 'INPUT' },
            { key: 'and', label: 'AND' },
            { key: 'or', label: 'OR' },
            { key: 'not', label: 'NOT' },
            { key: 'nand', label: 'NAND' },
            { key: 'nor', label: 'NOR' },
            { key: 'xor', label: 'XOR' },
            { key: 'xnor', label: 'XNOR' },
            { key: 'bulb', label: 'OUTPUT' }
        ];

        let y = 140;
        types.forEach(t => {
            this.createComponent(panelWidth / 2, y, t.key, t.label);
            y += 80;
        });

        this.timerActive = false;
        this.timerCountdown = 15;
        this.timerText = this.add.text(width - 100, 20, `Time: ${this.timerCountdown}`, { 
            fontSize: '24px', 
            color: '#ff0000',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(1000);
        
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true,
            paused: true
        });

        this.checkText = this.add.text(width / 2, height - 70, '', { fontSize: '18px', color: '#000000', fontStyle: 'bold', padding: { x: 15, y: 8 } }).setOrigin(0.5);
        this._origCheckTextSet = this.checkText.setText.bind(this.checkText);
        this._suppressCheckTextClear = false;
        this._suppressCheckTextClearUntil = 0;
        this._checkTextTimer = null;
        this.showStatus = (text, color = '#000000', holdMs = 2000) => {
            try { if (this._checkTextTimer && this._checkTextTimer.remove) this._checkTextTimer.remove(false); } catch (e) {}
            try { this.checkText.setStyle({ color }); } catch (e) {}
            try { this._origCheckTextSet(text); } catch (e) {}
            let delay = holdMs;
            try {
                if (this._suppressCheckTextClearUntil && this._suppressCheckTextClearUntil > Date.now()) {
                    const remaining = this._suppressCheckTextClearUntil - Date.now();
                    delay = Math.max(delay, remaining + 50);
                }
            } catch (e) {}
            try {
                this._checkTextTimer = this.time.delayedCall(delay, () => {
                    try { this._origCheckTextSet(''); } catch (e) {}
                    try { this.checkText.setStyle({ color: '#000000' }); } catch (e) {}
                    this._checkTextTimer = null;
                });
            } catch (e) {}
        };
        this.checkText.setText = (txt) => {
            try {
                if (txt === '' && this._suppressCheckTextClear) {
                    return this.checkText;
                }
            } catch (e) {  }
            return this._origCheckTextSet(txt), this.checkText;
        };

    this.inputIndices = new Set();
    this.bulbIndices = new Set();

    this.tasks = [
        { id: 'and_task', prompt: 'Naloga 1: Poveži AND z OUTPUT (preveri osnovna AND vrata).', gateType: 'AND', points: 10, completed: false },
        { id: 'or_task', prompt: 'Naloga 2: Poveži OR z OUTPUT (preveri osnovna OR vrata).', gateType: 'OR', points: 10, completed: false },
        { id: 'not_task', prompt: 'Naloga 3: Poveži NOT z OUTPUT (preveri negacijo).', gateType: 'NOT', points: 10, completed: false },
        { id: 'nand_task', prompt: 'Naloga 4: Poveži NAND z OUTPUT.', gateType: 'NAND', points: 10, completed: false },
        { id: 'nor_task', prompt: 'Naloga 5: Poveži NOR z OUTPUT.', gateType: 'NOR', points: 10, completed: false },
        { id: 'xor_task', prompt: 'Naloga 6: Poveži XOR z OUTPUT.', gateType: 'XOR', points: 10, completed: false },
        { id: 'xnor_task', prompt: 'Naloga 7: Poveži XNOR z OUTPUT.', gateType: 'XNOR', points: 10, completed: false },
        { id: 'mix_1', prompt: 'Naloga 8: Naredi vezje: OUTPUT poveži na XOR; XOR naj ima vhoda AND in OR.', gateType: ['AND','OR','XOR'], points: 20, completed: false },
        { id: 'mix_2', prompt: 'Naloga 9: Naredi vezje: OUTPUT poveži na OR; OR naj ima vhoda NAND in NOR.', gateType: ['NAND','NOR','OR'], points: 20, completed: false },
        { id: 'mix_3', prompt: 'Naloga 10: Naredi vezje: OUTPUT poveži na XNOR; XNOR naj ima vhoda AND in XOR.', gateType: ['AND','XOR','XNOR'], points: 20, completed: false }
    ];
        
    const getRandomTaskIndex = () => {
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        
        if (uncompletedTasks.length === 0) {
            return Math.floor(Math.random() * this.tasks.length);
        }
        
        const randomIndexInUncompleted = Math.floor(Math.random() * uncompletedTasks.length);
        const randomTask = uncompletedTasks[randomIndexInUncompleted];
        
        return this.tasks.findIndex(task => task.id === randomTask.id);
    };

    this.currentTaskIndex = getRandomTaskIndex();
    this.startTimer();

    const taskBoxWidth = Math.min(420, width - panelWidth - 80);
    const taskBoxHeight = 80;
    const taskBoxX = panelWidth + 20;
    const taskBoxY = 20;
    this.taskBox = this.add.rectangle(taskBoxX, taskBoxY, taskBoxWidth, taskBoxHeight, 0x222222, 0.95).setOrigin(0, 0).setDepth(1000);
    this.taskBox.setStrokeStyle(2, 0xffffff);
    this.taskText = this.add.text(taskBoxX + 10, taskBoxY + 10, this.tasks[this.currentTaskIndex].prompt, { fontSize: '14px', color: '#ffffff', wordWrap: { width: taskBoxWidth - 20 } }).setDepth(1001).setOrigin(0,0);

        const buttonWidth = 180;
        const buttonHeight = 45;
        const cornerRadius = 10;

        const makeButton = (x, y, label, onClick, opts = {}) => {
            const bg = this.add.graphics();
            const defaultColor = 0x3399ff;
            const hoverColor = 0x0f5cad;
            const activeColor = opts.activeColor || null;

            const drawBg = (color) => {
                bg.clear();
                bg.fillStyle(color, 1);
                bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
            };

            drawBg(defaultColor);

            const button = { bg, active: false, activeColor };

            const shadeColor = (hex, factor) => {
                if (hex == null) return null;
                const h = typeof hex === 'number' ? hex : parseInt(hex);
                const r = Math.min(255, Math.max(0, Math.round(((h >> 16) & 0xff) * factor)));
                const g = Math.min(255, Math.max(0, Math.round(((h >> 8) & 0xff) * factor)));
                const b = Math.min(255, Math.max(0, Math.round((h & 0xff) * factor)));
                return (r << 16) | (g << 8) | b;
            };

            const activeHoverColor = activeColor ? shadeColor(activeColor, 0.85) : null;
            const hitZone = this.add.zone(x, y, buttonWidth, buttonHeight)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    const hover = (button.active && button.activeColor) ? (activeHoverColor || hoverColor) : hoverColor;
                    drawBg(hover);
                })
                .on('pointerout', () => {
                    drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
                })
                .on('pointerdown', () => {
                    if (typeof onClick === 'function') {
                        onClick();
                    }
                });

            const text = this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

            button.text = text;
            button.hitZone = hitZone;
            button.setActive = (isActive) => {
                button.active = !!isActive;
                drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
            };

            return button;
        };

        //makeButton(width - 140, 75, 'Lestvica', () => this.scene.start('ScoreboardScene'));
        makeButton(width - 140, 125, 'Preveri', () => {
            this._suppressCheckTextClear = true;
            this._suppressCheckTextClearUntil = Date.now() + 3000;
            this.time.delayedCall(3000, () => { this._suppressCheckTextClear = false; this._suppressCheckTextClearUntil = 0; });
            this.evaluateCircuit();
        });
        //makeButton(width - 140, 175, 'Reset', () => this.resetWorkspace());

        const backButton = this.add.text(Math.round(panelWidth / 2), 20, '↩ Nazaj', { fontFamily: 'Arial', fontSize: '20px', color: '#387affff', padding: { x: 20, y: 10 } })
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ color: '#0054fdff' }))
            .on('pointerout', () => backButton.setStyle({ color: '#387affff' }))
            .on('pointerdown', () => {
                try { this.resetWorkspace(); } catch (e) { }
                this.cameras.main.fade(300, 0, 0, 0);
                this.time.delayedCall(300, () => { this.scene.start('LabScene'); });
            });

        this.placedComponents = [];
        this.connections = [];
        this.connectingPin = null;
        this.previewLine = null;
        this.gridSize = 40;
        this.gridStartX = panelWidth;

        this.lastEvaluationTime = 0;
        this.evaluationThrottle = 50;
        this.pinTooltip = null;
        this.pinTooltipTimer = null;

        this.events.on('update', () => {
            this.updatePreviewLine();
            this.updateCircuitEvaluation();
        });
    }

        startTimer() {
        this.timerCountdown = 15;
        this.timerText.setText(`Time: ${this.timerCountdown}`);
        this.timerText.setColor('#00ff00');
        
        if (this.timerEvent) {
            this.timerEvent.paused = false;
        }
        
        this.timerActive = true;
    }

    stopTimer() {
        this.timerActive = false;
        if (this.timerEvent) {
            this.timerEvent.paused = true;
        }
    }

    resetTimer() {
        this.timerCountdown = 15;
        this.timerText.setText(`Time: ${this.timerCountdown}`);
        this.timerText.setColor('#ff0000');
    }

    updateTimer() {
        if (!this.timerActive) return;
        
        this.timerCountdown--;
        this.timerText.setText(`Time: ${this.timerCountdown}`);
        
        if (this.timerCountdown <= 5) {
            this.timerText.setColor('#ff0000');
        } else if (this.timerCountdown <= 10) {
            this.timerText.setColor('#ff9900');
        } else {
            this.timerText.setColor('#00ff00');
        }
        
        if (this.timerCountdown <= 0) {
            console.log("failed");
            this.stopTimer();
            
            this.showStatus('Čas je potekel! Naloga ni bila rešena v danem času.', '#ff0000', 3000);
        }
    }

    updatePreviewLine() {
        if (!this.connectingPin) {
            if (this.previewLine) {
                this.previewLine.destroy();
                this.previewLine = null;
            }
            if (this.placedComponents && this.placedComponents.length > 0) {
                this.placedComponents.forEach(c => {
                    if (c.getData('isDragging')) {
                        this.updateConnectionsForGate(c.getData('gateId'));
                    }
                });
            }
            return;
        }

        const { pinObject, container } = this.connectingPin;
        const pointer = this.input.activePointer;
        
        if (!this.previewLine) {
            this.previewLine = this.add.graphics();
            this.previewLine.setDepth(9);
        } else {
            this.previewLine.clear();
        }

        const fromX = container.x + (pinObject ? pinObject.x : 0);
        const fromY = container.y + (pinObject ? pinObject.y : 0);
        const toX = pointer.x;
        const toY = pointer.y;

        this.previewLine.lineStyle(3, 0xffff00, 0.7);
        this.previewLine.beginPath();
        this.previewLine.moveTo(fromX, fromY);
        this.previewLine.lineTo(toX, toY);
        this.previewLine.strokePath();
    }

    updateCircuitEvaluation() {
        const now = Date.now();
        if (now - this.lastEvaluationTime < this.evaluationThrottle) {
            return;
        }
        this.lastEvaluationTime = now;
        try {
            if (this.logicCircuit && typeof this.logicCircuit.evaluate === 'function') {
                this.logicCircuit.evaluate();
            }
        } catch (e) {
            //console.error('Circuit evaluation error:', e);
        }

        try {
            (this.placedComponents || []).forEach(c => {
                if (c.getData('isBulb')) {
                    const gate = c.getData('logicGate');
                    const label = c.getData('labelTextObj');
                    const displayName = c.getData('displayName') || 'OUTPUT';
                    if (gate && label) {
                        const val = !!gate.getOutput();
                        label.setText(`${displayName} = ${val ? 'true' : 'false'}`);
                    }
                }
            });
        } catch (e) { }
    }

    showPinTooltip(pin, container, isOutput) {
        this.hidePinTooltip();

        try {
            const gate = container.getData('logicGate');
            if (!gate) return;
            let pinValue = false;
            if (isOutput) {
                pinValue = !!gate.getOutput();
            } else {
                const inputPins = container.getData('inputPins') || [];
                const pinIndex = inputPins.indexOf(pin);
                if (pinIndex >= 0) {
                    const inputGate = gate.inputGates[pinIndex];
                    pinValue = inputGate ? !!inputGate.getOutput() : false;
                }
            }
            const pinWorldX = container.x + pin.x;
            const pinWorldY = container.y + pin.y;
            const tooltipBg = this.add.rectangle(pinWorldX, pinWorldY - 25, 80, 30, 0x000000, 0.9)
                .setStrokeStyle(2, 0xffffff)
                .setOrigin(0.5)
                .setDepth(1000);

            const tooltipText = this.add.text(pinWorldX, pinWorldY - 25, pinValue ? 'true' : 'false', {
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold'
            })
                .setOrigin(0.5)
                .setDepth(1001);

            this.pinTooltip = { bg: tooltipBg, text: tooltipText };
        } catch (e) {}
    }

    hidePinTooltip() {
        if (this.pinTooltip) {
            try {
                if (this.pinTooltip.bg && this.pinTooltip.bg.destroy) this.pinTooltip.bg.destroy();
                if (this.pinTooltip.text && this.pinTooltip.text.destroy) this.pinTooltip.text.destroy();
            } catch (e) {}
            this.pinTooltip = null;
        }
    }

    createGrid() {
        const { width, height } = this.cameras.main;
        const g = this.add.graphics();
        g.lineStyle(2, 0x8b7355, 0.4);
        const startX = this.gridStartX || 200;
        for (let x = startX; x < width; x += this.gridSize) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath(); }
        for (let y = 0; y < height; y += this.gridSize) { g.beginPath(); g.moveTo(startX, y); g.lineTo(width, y); g.strokePath(); }
    }

    snapToGrid(x, y) {
        const startX = this.gridStartX || 200;
        const snappedX = Math.round((x - startX) / this.gridSize) * this.gridSize + startX;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;
        return { x: snappedX, y: snappedY };
    }

    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    cancelConnection() {
        if (this.connectingPin) {
            const { pinObject, container } = this.connectingPin;
            if (pinObject && pinObject.setStrokeStyle) {
                pinObject.setStrokeStyle(2, 0xffffff);
            }
            this.connectingPin = null;
            this._origCheckTextSet('');
        }
        if (this.previewLine) {
            this.previewLine.destroy();
            this.previewLine = null;
        }
    }

    completeConnection(targetPin, targetContainer, targetIsOutput) {
        if (!this.connectingPin) return;

        const source = this.connectingPin;
        const sourcePin = source.pinObject;
        const sourceContainer = source.container;
        const sourceIsOutput = source.isOutput;
        const sourceId = sourceContainer.getData('gateId');
        const targetId = targetContainer.getData('gateId');
        const sourceType = sourceContainer.getData('type');
        const targetType = targetContainer.getData('type');

        if (!sourceId || !targetId) {
            this.checkText.setText('Neveljavna vrata za povezavo');
            this.cancelConnection();
            return;
        }

        if (sourceIsOutput === targetIsOutput) {
            this.checkText.setText('Ne morete povezati ' + (sourceIsOutput ? 'dveh izhodov' : 'dveh vhodov'));
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
            this.cancelConnection();
            return;
        }

        let finalSourceId, finalTargetId, toPinIndex = 0;
        if (sourceIsOutput) {
            finalSourceId = sourceId;
            finalTargetId = targetId;
            const targetPins = targetContainer.getData('inputPins') || [];
            toPinIndex = targetPins.indexOf(targetPin);
        } else {
            finalSourceId = targetId;
            finalTargetId = sourceId;
            const targetPins = sourceContainer.getData('inputPins') || [];
            toPinIndex = targetPins.indexOf(sourcePin);
        }

        if (sourceType === 'input' && targetType === 'input') {
            this.checkText.setText('Ne morete povezati dveh INPUT vrat');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
            this.cancelConnection();
            return;
        }

        const targetGateObj = this.logicCircuit.getGate(finalTargetId);
        if (targetGateObj && targetGateObj.inputGates[toPinIndex]) {
            this.checkText.setText('Ta vhod je že zaseden');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
            this.cancelConnection();
            return;
        }

        let ok = false;
        try {
            ok = this.logicCircuit.connectGatesWithIndex(finalSourceId, finalTargetId, toPinIndex);
        } catch (err) {
            ok = false;
        }

        if (ok) {
            this.checkText.setText('Povezano');
            
            const fromPin = sourceIsOutput ? sourcePin : targetPin;
            const toPin = sourceIsOutput ? targetPin : sourcePin;
            const fromContainer = sourceIsOutput ? sourceContainer : targetContainer;
            const toContainer = sourceIsOutput ? targetContainer : sourceContainer;

            const fromX = fromContainer.x + (fromPin ? fromPin.x : 36);
            const fromY = fromContainer.y + (fromPin ? fromPin.y : 0);
            const toX = toContainer.x + (toPin ? toPin.x : -36);
            const toY = toContainer.y + (toPin ? toPin.y : 0);

            const gfx = this.add.graphics();
            gfx.lineStyle(4, 0x424b55, 1);
            gfx.beginPath();
            gfx.moveTo(fromX, fromY);
            gfx.lineTo(toX, toY);
            gfx.strokePath();
            gfx.setDepth(10);

            const dx = toX - fromX;
            const dy = toY - fromY;
            const dist = Math.hypot(dx, dy);
            const midX = fromX + dx / 2;
            const midY = fromY + dy / 2;
            const hit = this.add.zone(midX, midY, Math.max(30, dist), 16).setOrigin(0.5).setInteractive();
            hit.on('pointerdown', () => {
                try {
                    const srcGate = this.logicCircuit.getGate(finalSourceId);
                    const dstGate = this.logicCircuit.getGate(finalTargetId);
                    if (srcGate && dstGate) srcGate.disconnectFrom(dstGate);
                } catch (e) { }
                try { gfx.destroy(); } catch (e) {}
                try { hit.destroy(); } catch (e) {}
                this.connections = this.connections.filter(c => !(c.fromId === finalSourceId && c.toId === finalTargetId && c.toPinIndex === toPinIndex));
            });

            this.connections.push({ fromId: finalSourceId, toId: finalTargetId, fromPinIndex: 0, toPinIndex, gfx, hitZone: hit });
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
        } else {
            this.checkText.setText('Povezava ni mogoča');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
        }

        this.cancelConnection();
    }

    setupInputOutputPins(container, type, labelText, img) {
        const pinRadius = 6;
        const inputPinColor = 0xff6600;
        const outputPinColor = 0x00ff00;
        const highlightColor = 0xffff00;
        
        let maxInputs = 2;
        if (type === 'not' || type === 'bulb') maxInputs = 1;
        if (type === 'input') maxInputs = 0;

        let inputPins = container.getData('inputPins') || [];
        if (!inputPins || inputPins.length === 0) {
            inputPins = [];

            for (let i = 0; i < maxInputs; i++) {
                const yOff = (maxInputs === 1) ? 0 : (i === 0 ? -10 : 10);
                const inPin = this.add.circle(-36, yOff, pinRadius, inputPinColor).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
                inPin.setInteractive({ useHandCursor: true });

                inPin.on('pointerdown', (pointer, localX, localY, event) => {
                    if (event && event.stopPropagation) event.stopPropagation();
                    
                    if (!this.connectingPin) {
                        this.connectingPin = { pinObject: inPin, container, isOutput: false };
                        inPin.setStrokeStyle(3, highlightColor);
                        this.checkText.setText('Izberi izhod za povezavo');
                        return;
                    }

                    if (this.connectingPin.pinObject === inPin) {
                        this.cancelConnection();
                        return;
                    }

                    this.completeConnection(inPin, container, false);
                });

                inPin.on('pointerover', () => {
                    this.showPinTooltip(inPin, container, false);
                });
                inPin.on('pointerout', () => {
                    this.hidePinTooltip();
                });
                container.add(inPin);
                inputPins.push(inPin);
            }
        }
        let outputPin = container.getData('outputPin') || null;
        if (type !== 'bulb' && !outputPin) {
            outputPin = this.add.circle(36, 0, pinRadius, outputPinColor).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
            outputPin.setInteractive({ useHandCursor: true });
            outputPin.on('pointerdown', (pointer, localX, localY, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                
                if (!this.connectingPin) {
                    this.connectingPin = { pinObject: outputPin, container, isOutput: true };
                    outputPin.setStrokeStyle(3, highlightColor);
                    this.checkText.setText('Izberi vhod za povezavo');
                    return;
                }
                if (this.connectingPin.pinObject === outputPin) {
                    this.cancelConnection();
                    return;
                }
                this.completeConnection(outputPin, container, true);
            });

            outputPin.on('pointerover', () => {
                this.showPinTooltip(outputPin, container, true);
            });
            outputPin.on('pointerout', () => {
                this.hidePinTooltip();
            });
            container.add(outputPin);
        }

        container.setData('inputPins', inputPins);
        container.setData('outputPin', outputPin);
    }

    createComponent(x, y, type, labelText) {
        const container = this.add.container(x, y);
        container.setDepth(5);

        var size = 80;
        var textureName = '';
        switch (type) {
            case 'bulb': textureName = 'BULB'; break;
            case 'and': textureName = 'AND'; break;
            case 'or': textureName = 'OR'; break;
            case 'not': textureName = 'NOT'; break;
            case 'nand': textureName = 'NAND'; break;
            case 'nor': textureName = 'NOR'; break;
            case 'xor': textureName = 'XOR'; break;
            case 'xnor': textureName = 'XNOR'; break;
            case 'input': textureName = 'SWITCH_ON'; break;
        }

        const img = this.add.image(0, 0, textureName).setDisplaySize(size, size).setOrigin(0.5);
        container.add(img);
        container.setData('img', img);

        const label = this.add.text(0, 36, labelText || type, { fontSize: '12px', color: '#fff', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5);
        container.add(label);

        container.setSize(64, 64);
        container.setInteractive({ draggable: true, useHandCursor: true });
        container.setData('originalX', x);
        container.setData('originalY', y);
        container.setData('type', type);
        container.setData('isInPanel', true);

        this.input.setDraggable(container);
        container.on('pointerover', () => {});
        container.on('pointerout', () => {});

        container.on('dragstart', () => { container.setData('isDragging', true); });

        container.on('drag', (pointer, dragX, dragY) => { 
            container.x = dragX; 
            container.y = dragY;
            this.updateConnectionsForGate(container.getData('gateId'));
        });

        container.on('pointerdown', (pointer) => {
            if (pointer.button === 2) {
                const gateId = container.getData('gateId');
                if (gateId && !container.getData('isInPanel')) {
                    this.deleteGate(container, gateId);
                }
            }
        });

        container.on('dragend', () => {
            const isInPanel = container.x < (this.gridStartX || 200);
            if (isInPanel && !container.getData('isInPanel')) {
                const gateId = container.getData('gateId');

                if (this.connectingSource === container) this.connectingSource = null;

                try {
                    this.connections = this.connections.filter(conn => {
                        if (conn.fromId === gateId || conn.toId === gateId) {
                            try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { }
                            try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { }
                            return false;
                        }
                        return true;
                    });
                } catch (e) { }

                try { if (this.logicCircuit && typeof this.logicCircuit.removeGate === 'function') this.logicCircuit.removeGate(gateId); } catch (e) { }

                try { this.placedComponents = this.placedComponents.filter(c => c !== container); } catch (e) { }

                try {
                    const name = container.getData('displayName');
                    const idx = container.getData('displayIndex');
                    const t = container.getData('type');
                    if (t === 'input' && typeof idx === 'number') {
                        try { this.inputIndices.delete(idx); } catch (e) {}
                    }
                    if (t === 'bulb' && typeof idx === 'number') {
                        try { this.bulbIndices.delete(idx); } catch (e) {}
                    }
                } catch (e) { }

                container.destroy();
            } else if (!isInPanel && container.getData('isInPanel')) {
                const snapped = this.snapToGrid(container.x, container.y);
                container.x = snapped.x; container.y = snapped.y;

                const id = `${type}_${this.getRandomInt(1000, 9999)}`;
                let gateType = null;
                switch (type) {
                    case 'input': gateType = GateTypes.input; break;
                    case 'and': gateType = GateTypes.and; break;
                    case 'or': gateType = GateTypes.or; break;
                    case 'not': gateType = GateTypes.not; break;
                    case 'nand': gateType = GateTypes.nand; break;
                    case 'nor': gateType = GateTypes.nor; break;
                    case 'xor': gateType = GateTypes.xor; break;
                    case 'xnor': gateType = GateTypes.xnor; break;
                    case 'bulb': gateType = GateTypes.bulb; break;
                    default: gateType = GateTypes.and;
                }

                const gate = this.logicCircuit.addGate(gateType, id);
                container.setData('logicGate', gate);
                container.setData('gateId', id);
                container.setData('img', img);
                container.setData('labelTextObj', label);

                if (type === 'input') {
                    container.setData('inputValue', true);
                    let idx = 1;
                    while (this.inputIndices.has(idx)) idx++;
                    this.inputIndices.add(idx);
                    const inputName = `INPUT ${idx}`;
                    container.setData('displayName', inputName);
                    container.setData('displayIndex', idx);
                    label.setText(`${inputName} = true`);
                }

                if (type === 'bulb') {
                    container.setData('isBulb', true);
                    let bidx = 1;
                    while (this.bulbIndices.has(bidx)) bidx++;
                    this.bulbIndices.add(bidx);
                    const displayName = `OUTPUT ${bidx}`;
                    label.setText(displayName);
                    container.setData('displayName', displayName);
                    container.setData('displayIndex', bidx);
                }

                container.setData('isInPanel', false);
                container.setDepth(20);

                this.setupInputOutputPins(container, type, labelText, img);

                this.placedComponents.push(container);

                this.createComponent(container.getData('originalX'), container.getData('originalY'), container.getData('type'), labelText);

            } else if (!container.getData('isInPanel')) {
                const snapped = this.snapToGrid(container.x, container.y);
                container.x = snapped.x; container.y = snapped.y;

                this.updateConnectionsForGate(container.getData('gateId'));
            } else {
                container.x = container.getData('originalX'); container.y = container.getData('originalY');
            }

            this.time.delayedCall(200, () => container.setData('isDragging', false));
        });

        container.on('pointerdown', (pointer) => {
            if (container.getData('isInPanel')) return;

            const now = Date.now();
            const last = container.getData('lastClick') || 0;
            if (now - last < 300) {
                if (container.getData('type') === 'input') {
                    const gate = container.getData('logicGate');
                    const current = container.getData('inputValue') === undefined ? true : container.getData('inputValue');
                    const newVal = !current;
                    
                    if (gate && gate.setValue) gate.setValue(newVal);

                    container.setData('inputValue', newVal);
                    const inputName = container.getData('displayName') || labelText || `INPUT`;
                    label.setText(`${inputName} = ${newVal ? 'true' : 'false'}`);
                    this.checkText.setText(`${inputName} = ${newVal ? 'true' : 'false'}`);
                    this.time.delayedCall(1200, () => this._origCheckTextSet(''));

                    img.setTexture(newVal ? 'SWITCH_ON' : 'SWITCH_OFF');
                }
                container.setData('lastClick', 0);
                return;
            }
            container.setData('lastClick', now);
        });
    }

    evaluateCircuit() {
        const resultsFull = this.logicCircuit.evaluate();
        const endResults = {};
        if (this.logicCircuit && this.logicCircuit.gates) {
            for (const [id, gate] of this.logicCircuit.gates) {
                if (!gate.outputGates || gate.outputGates.length === 0) {
                    endResults[id] = gate.getOutput();
                }
            }
        }
        const bulbEntries = [];
        try {
            (this.placedComponents || []).forEach(c => {
                if (c.getData('isBulb')) {
                    const name = c.getData('displayName') || c.getData('gateId') || 'OUTPUT';
                    const gate = c.getData('logicGate');
                    let val = false;
                    try { val = !!(gate && gate.getOutput()); } catch (e) { val = false; }
                    bulbEntries.push(`${name}: ${val ? 'true' : 'false'}`);
                }
            });
        } catch (e) { }

        try {
            this.placedComponents.forEach(c => {
                if (c.getData('isBulb')) {
                    const gate = c.getData('logicGate');
                    const label = c.getData('labelTextObj');
                    const displayName = c.getData('displayName') || 'OUTPUT';
                    if (gate && label) {
                        const val = !!gate.getOutput();
                        label.setText(`${displayName} = ${val ? 'true' : 'false'}`);
                    }
                }
            });
        } catch (e) { }

        let taskCompleted = false;
        try {
            taskCompleted = this.checkCurrentTaskCompletion();
        } catch (e) { }

    const statusText = bulbEntries.length > 0 ? `OUTPUT values: ${bulbEntries.join(', ')}` : 'No OUTPUT present';

        if (taskCompleted && this.tasks && this.tasks[this.currentTaskIndex] && !this.tasks[this.currentTaskIndex].completed) {
            this.tasks[this.currentTaskIndex].completed = true;
            this.addPoints(this.tasks[this.currentTaskIndex].points);
            this.showStatus(`${statusText} — Naloga opravljena! (+${this.tasks[this.currentTaskIndex].points})`, '#00aa00', 2000);
            this.time.delayedCall(1500, () => this.nextTask());
        } else {
            const taskMsg = (this.tasks && this.tasks[this.currentTaskIndex] && this.tasks[this.currentTaskIndex].completed) ? 'Naloga opravljena!' : 'Naloga ni opravljena';
            const color = (taskMsg === 'Naloga opravljena!') ? '#00aa00' : '#cc0000';
            this.showStatus(`${statusText} — ${taskMsg}`, color, 2000);
            try { this.time.delayedCall(2000, () => { try { this._origCheckTextSet(''); this.checkText.setStyle({ color: '#000000' }); } catch (e) {} }); } catch (e) {}
        }
    }

    checkCurrentTaskCompletion() {
        if (!this.tasks || this.currentTaskIndex == null) return false;
        const task = this.tasks[this.currentTaskIndex];
        if (!task) return false;

        try { if (this.logicCircuit && typeof this.logicCircuit.evaluate === 'function') this.logicCircuit.evaluate(); } catch (e) { }

        for (const [id, gate] of this.logicCircuit.gates) {
            if (gate.operation !== 'LIGHT') continue;
            let bulbVal = false;
            try { bulbVal = !!(gate && gate.getOutput && gate.getOutput()); } catch (e) { bulbVal = false; }
            if (!bulbVal) continue;

            const src = gate.inputGates[0];
            if (!src) continue;

            if (typeof task.gateType === 'string') {
                if (src.operation === task.gateType) {
                    const numInputs = src.inputGates ? src.inputGates.filter(Boolean).length : 0;
                    const okStructure = (task.gateType === 'NOT' || task.gateType === 'BUFFER') ? true : (numInputs >= 1);
                    if (okStructure) {
                        task.completed = true;
                        this.showStatus('Naloga opravljena!', '#00aa00', 2000);
                        try { this.addPoints(task.points); } catch (e) {}
                        this.time.delayedCall(1500, () => this.nextTask());
                        return true;
                    }
                }
            } else if (Array.isArray(task.gateType)) {
                const req = task.gateType;
                if (req.length === 2) {
                    const child = req[0]; const top = req[1];
                    if (src.operation === top) {
                        const inputs = src.inputGates ? src.inputGates.filter(Boolean) : [];
                        const hasChild = inputs.some(g => g && g.operation === child);
                        if (hasChild) {
                            task.completed = true;
                            this.showStatus('Naloga opravljena!', '#00aa00', 2000);
                            try { this.addPoints(task.points); } catch (e) {}
                            this.time.delayedCall(1500, () => this.nextTask());
                            return true;
                        }
                    }
                } else if (req.length >= 3) {
                    const childA = req[0]; const childB = req[1]; const top = req[2];
                    if (src.operation === top) {
                        const inputs = src.inputGates ? src.inputGates.filter(Boolean) : [];
                        const hasA = inputs.some(g => g && g.operation === childA);
                        const hasB = inputs.some(g => g && g.operation === childB);
                        if (hasA && hasB) {
                            task.completed = true;
                            this.showStatus('Naloga opravljena!', '#00aa00', 2000);
                            try { this.addPoints(task.points); } catch (e) {}
                            this.time.delayedCall(1500, () => this.nextTask());
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    nextTask() {
        this.currentTaskIndex++;
        localStorage.setItem('logicTasksIndex', this.currentTaskIndex.toString());
        if (this.currentTaskIndex < this.tasks.length) {
            this.taskText.setText(this.tasks[this.currentTaskIndex].prompt);
        } else {
            this.taskText.setText('Vse naloge opravljene! Bravo!');
            this.showStatus('Čestitke! Vse naloge opravljene!', '#00aa00', 3000);
            try { this.addPoints(20); } catch (e) {}
            localStorage.removeItem('logicTasksIndex');
        }
    }

    addPoints(points) {
        const user = localStorage.getItem('username');
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userData = users.find(u => u.username === user);
        if (userData) {
            userData.score = (userData.score || 0) + points;
        }
        localStorage.setItem('users', JSON.stringify(users));
    }

    resetWorkspace() {
        this.placedComponents.forEach(c => c.destroy());
        this.placedComponents = [];
        if (this.connections && this.connections.length > 0) {
            this.connections.forEach(conn => {
                try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { }
                try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { }
            });
        }
        this.connections = [];
        this.logicCircuit = new LogicCircuit();
        try { this.inputIndices = new Set(); } catch (e) {}
        try { this.bulbIndices = new Set(); } catch (e) {}
        this._origCheckTextSet('Workspace reset');
        this.time.delayedCall(1500, () => this._origCheckTextSet(''));
    }

    deleteGate(container, gateId) {
        try {
            this.connections = this.connections.filter(conn => {
                if (conn.fromId === gateId || conn.toId === gateId) {
                    try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { }
                    try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { }
                    return false;
                }
                return true;
            });

            try {
                if (this.logicCircuit && typeof this.logicCircuit.removeGate === 'function') {
                    this.logicCircuit.removeGate(gateId);
                }
            } catch (e) { }

            this.placedComponents = this.placedComponents.filter(c => c !== container);

            try {
                const idx = container.getData('displayIndex');
                const t = container.getData('type');
                if (t === 'input' && typeof idx === 'number') {
                    this.inputIndices.delete(idx);
                }
                if (t === 'bulb' && typeof idx === 'number') {
                    this.bulbIndices.delete(idx);
                }
            } catch (e) { }

            if (this.connectingPin && (this.connectingPin.container === container)) {
                this.cancelConnection();
            }

            container.destroy();

            this.checkText.setText('Gate deleted');
            this.time.delayedCall(1000, () => this._origCheckTextSet(''));
        } catch (e) { }
    }

    updateConnectionsForGate(gateId) {
        this.connections.forEach(conn => {
            if (conn.fromId === gateId || conn.toId === gateId) {
                const fromContainer = this.placedComponents.find(c => c.getData('gateId') === conn.fromId);
                const toContainer = this.placedComponents.find(c => c.getData('gateId') === conn.toId);
                if (fromContainer && toContainer && conn.gfx) {
                    const fromPin = fromContainer.getData('outputPin');
                    const toPins = toContainer.getData('inputPins') || [];
                    const fromX = fromContainer.x + (fromPin ? fromPin.x : 36);
                    const fromY = fromContainer.y + (fromPin ? fromPin.y : 0);
                    const toPinObj = toPins[conn.toPinIndex];
                    const toX = toContainer.x + (toPinObj ? toPinObj.x : 0);
                    const toY = toContainer.y + (toPinObj ? toPinObj.y : 0);

                    conn.gfx.clear();
                    conn.gfx.lineStyle(4, 0x424b55, 1);
                    conn.gfx.beginPath();
                    conn.gfx.moveTo(fromX, fromY);
                    conn.gfx.lineTo(toX, toY);
                    conn.gfx.strokePath();

                    if (conn.hitZone) {
                        const dx = toX - fromX; const dy = toY - fromY; const dist = Math.hypot(dx, dy);
                        const midX = fromX + dx / 2; const midY = fromY + dy / 2;
                        conn.hitZone.setPosition(midX, midY);
                        conn.hitZone.setSize(Math.max(30, dist), 16);
                    }
                }
            }
        });
    }

}
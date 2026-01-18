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
        this.load.html('tooltip', 'src/components/ui/tooltip.html');
    }

    create() {
        this.input.mouse.disableContextMenu();

        const { width, height } = this.cameras.main;
        this.gridSize = 40;
        this.cameras.main.roundPixels = true;
        
        this.createModernBackground(width, height);
        
        this.createSubtleGrid();
        
        const panelWidth = 220;
        this.createSidePanel(panelWidth, height);
        
        const title = this.add.text(panelWidth / 2, 60, 'LOGIC GATES', { 
            fontSize: '24px', 
            color: '#00ffcc',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '2px'
        }).setOrigin(0.5);
        
        title.setShadow(0, 0, 'rgba(0, 255, 204, 0.5)', 10, true, false);
        
        const types = [
            { key: 'input', label: 'INPUT', color: 0xff5555 },
            { key: 'and', label: 'AND', color: 0x5555ff },
            { key: 'or', label: 'OR', color: 0x55ff55 },
            { key: 'not', label: 'NOT', color: 0xff55ff },
            { key: 'nand', label: 'NAND', color: 0xffaa55 },
            { key: 'nor', label: 'NOR', color: 0x55ffff },
            { key: 'xor', label: 'XOR', color: 0xffff55 },
            { key: 'xnor', label: 'XNOR', color: 0xaa55ff },
            { key: 'bulb', label: 'OUTPUT', color: 0xffcc00 }
        ];

        let y = 140;
        types.forEach(t => {
            this.createComponent(panelWidth / 2, y, t.key, t.label, t.color);
            y += 90;
        });

        this.timerActive = false;
        this.timerCountdown = 15;
        this.timerText = this.add.text(width - 120, 30, `⏱ ${this.timerCountdown}s`, { 
            fontSize: '28px', 
            color: '#00ffcc',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: 'rgba(0, 0, 30, 0.8)',
            padding: { x: 20, y: 10 },
            borderRadius: 10
        }).setOrigin(0.5).setDepth(1000);
        
        this.timerText.setShadow(0, 0, 'rgba(0, 255, 204, 0.5)', 5, true, false);
        
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true,
            paused: true
        });

        this.checkText = this.add.text(width / 2, height - 50, '', { 
            fontSize: '20px', 
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: 'rgba(0, 20, 40, 0.8)',
            padding: { x: 20, y: 12 },
            borderRadius: 8
        }).setOrigin(0.5);
        
        this.checkText.setShadow(2, 2, 'rgba(0, 0, 0, 0.5)', 2, true, false);
        
        this._origCheckTextSet = this.checkText.setText.bind(this.checkText);
        this._suppressCheckTextClear = false;
        this._suppressCheckTextClearUntil = 0;
        this._checkTextTimer = null;
        
        this.showStatus = (text, color = '#ffffff', holdMs = 2000) => {
            try { 
                if (this._checkTextTimer && this._checkTextTimer.remove) this._checkTextTimer.remove(false); 
            } catch (e) {}
            
            try { 
                this.checkText.setStyle({ 
                    color,
                    backgroundColor: 'rgba(0, 20, 40, 0.9)'
                }); 
            } catch (e) {}
            
            try { 
                this._origCheckTextSet(text); 
            } catch (e) {}
            
            let delay = holdMs;
            try {
                if (this._suppressCheckTextClearUntil && this._suppressCheckTextClearUntil > Date.now()) {
                    const remaining = this._suppressCheckTextClearUntil - Date.now();
                    delay = Math.max(delay, remaining + 50);
                }
            } catch (e) {}
            
            try {
                this._checkTextTimer = this.time.delayedCall(delay, () => {
                    try { 
                        this._origCheckTextSet(''); 
                        this.checkText.setStyle({ 
                            color: '#ffffff',
                            backgroundColor: 'rgba(0, 20, 40, 0.8)'
                        }); 
                    } catch (e) {}
                    this._checkTextTimer = null;
                });
            } catch (e) {}
        };
        
        this.checkText.setText = (txt) => {
            try {
                if (txt === '' && this._suppressCheckTextClear) {
                    return this.checkText;
                }
            } catch (e) { }
            return this._origCheckTextSet(txt), this.checkText;
        };

        this.inputIndices = new Set();
        this.bulbIndices = new Set();

        this.tasks = [
            { id: 'and_task', prompt: 'Naloga 1: Poveži AND z OUTPUT', gateType: 'AND', points: 10, completed: false },
            { id: 'or_task', prompt: 'Naloga 2: Poveži OR z OUTPUT', gateType: 'OR', points: 10, completed: false },
            { id: 'not_task', prompt: 'Naloga 3: Poveži NOT z OUTPUT', gateType: 'NOT', points: 10, completed: false },
            { id: 'nand_task', prompt: 'Naloga 4: Poveži NAND z OUTPUT', gateType: 'NAND', points: 10, completed: false },
            { id: 'nor_task', prompt: 'Naloga 5: Poveži NOR z OUTPUT', gateType: 'NOR', points: 10, completed: false },
            { id: 'xor_task', prompt: 'Naloga 6: Poveži XOR z OUTPUT', gateType: 'XOR', points: 10, completed: false },
            { id: 'xnor_task', prompt: 'Naloga 7: Poveži XNOR z OUTPUT', gateType: 'XNOR', points: 10, completed: false },
            { id: 'mix_1', prompt: 'Naloga 8: XOR z vhodi AND in OR', gateType: ['AND','OR','XOR'], points: 20, completed: false },
            { id: 'mix_2', prompt: 'Naloga 9: OR z vhodi NAND in NOR', gateType: ['NAND','NOR','OR'], points: 20, completed: false },
            { id: 'mix_3', prompt: 'Naloga 10: XNOR z vhodi AND in XOR', gateType: ['AND','XOR','XNOR'], points: 20, completed: false },
            { id: 'mix_3_1', prompt: 'Naloga 11: XNOR z vhodi NOT, AND in XOR', gateType: ['NOT','AND','XOR','XNOR'], points: 20, completed: false }
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

        const taskBoxWidth = Math.min(450, width - panelWidth - 100);
        const taskBoxHeight = 90;
        const taskBoxX = panelWidth + 40;
        const taskBoxY = 30;
        
        this.taskBox = this.add.graphics();
        this.taskBox.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x1a1a4a, 0x1a1a4a, 1);
        this.taskBox.fillRoundedRect(taskBoxX, taskBoxY, taskBoxWidth, taskBoxHeight, 15);
        this.taskBox.setDepth(1000);
        
        this.taskBox.lineStyle(2, 0x00ffcc, 1);
        this.taskBox.strokeRoundedRect(taskBoxX, taskBoxY, taskBoxWidth, taskBoxHeight, 15);
        
        this.taskText = this.add.text(
            taskBoxX + 15, 
            taskBoxY + 15, 
            this.tasks[this.currentTaskIndex].prompt, 
            { 
                fontSize: '16px', 
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
                wordWrap: { width: taskBoxWidth - 30 },
                lineSpacing: 5
            }
        ).setDepth(1001).setOrigin(0, 0);

        const buttonWidth = 180;
        const buttonHeight = 50;
        const cornerRadius = 25;

        const makeButton = (x, y, label, onClick, opts = {}) => {
            const bg = this.add.graphics();
            const defaultColor = 0x0066cc;
            const hoverColor = 0x0088ff;
            const activeColor = opts.activeColor || 0x004488;

            const drawBg = (color, isHover = false) => {
                bg.clear();
                bg.fillStyle(color, 1);
                bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
                
                if (isHover) {
                    bg.lineStyle(3, 0x00ffcc, 0.5);
                    bg.strokeRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
                }
                
                bg.lineStyle(2, 0x00ffcc, 0.3);
                bg.strokeRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
            };

            drawBg(defaultColor);

            const button = { bg, active: false, activeColor };

            const hitZone = this.add.zone(x, y, buttonWidth, buttonHeight)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    drawBg(button.active && button.activeColor ? button.activeColor : hoverColor, true);
                })
                .on('pointerout', () => {
                    drawBg(button.active && button.activeColor ? button.activeColor : defaultColor, false);
                })
                .on('pointerdown', () => {
                    if (typeof onClick === 'function') {
                        onClick();
                    }
                });

            const text = this.add.text(x, y, label, { 
                fontFamily: 'Arial', 
                fontSize: '20px', 
                color: '#ffffff',
                fontStyle: 'bold',
                letterSpacing: '1px'
            }).setOrigin(0.5);

            text.setShadow(1, 1, 'rgba(0, 0, 0, 0.5)', 2, true, false);

            button.text = text;
            button.hitZone = hitZone;
            button.setActive = (isActive) => {
                button.active = !!isActive;
                drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
            };

            return button;
        };

        makeButton(width - 140, 100, '✅ Preveri', () => {
            this._suppressCheckTextClear = true;
            this._suppressCheckTextClearUntil = Date.now() + 3000;
            this.time.delayedCall(3000, () => { 
                this._suppressCheckTextClear = false; 
                this._suppressCheckTextClearUntil = 0; 
            });
            this.evaluateCircuit();
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

    createModernBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x1a1a3a, 1);
        bg.fillRect(0, 0, width, height);
        
        const gridPattern = this.make.graphics();
        gridPattern.lineStyle(1, 0x00ffcc, 0.05);
        for (let x = 0; x < width; x += 40) {
            gridPattern.moveTo(x, 0);
            gridPattern.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            gridPattern.moveTo(0, y);
            gridPattern.lineTo(width, y);
        }
        gridPattern.strokePath();
        const texture = gridPattern.generateTexture('gridPattern');
        this.add.image(width / 2, height / 2, 'gridPattern').setAlpha(0.1);
        
        this.add.graphics()
            .lineStyle(1, 0x00ffcc, 0.03)
            .strokeRect(50, 50, width - 100, height - 100);
    }

    createSubtleGrid() {
        const { width, height } = this.cameras.main;
        const g = this.add.graphics();
        g.lineStyle(1, 0x00ffcc, 0.1);
        const startX = this.gridStartX || 220;
        
        for (let x = startX; x < width; x += this.gridSize) { 
            g.beginPath(); 
            g.moveTo(x, 0); 
            g.lineTo(x, height); 
            g.strokePath(); 
        }
        
        for (let y = 0; y < height; y += this.gridSize) { 
            g.beginPath(); 
            g.moveTo(startX, y); 
            g.lineTo(width, y); 
            g.strokePath(); 
        }
    }

    createSidePanel(panelWidth, height) {
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x1a1a3a, 0x1a1a3a, 0x0a0a2a, 0x0a0a2a, 1);
        panel.fillRect(0, 0, panelWidth, height);
        
        panel.lineStyle(2, 0x00ffcc, 0.3);
        panel.strokeRect(0, 0, panelWidth, height);
        
        const panelPattern = this.add.graphics();
        panelPattern.lineStyle(1, 0x00ffcc, 0.05);
        for (let y = 0; y < height; y += 20) {
            panelPattern.moveTo(0, y);
            panelPattern.lineTo(panelWidth, y);
        }
    }

    startTimer() {
        this.timerCountdown = 15;
        this.timerText.setText(`⏱ ${this.timerCountdown}s`);
        this.timerText.setColor('#00ff00');
        this.timerText.setShadow(0, 0, 'rgba(0, 255, 0, 0.5)', 5, true, false);
        
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
        this.timerText.setText(`⏱ ${this.timerCountdown}s`);
        this.timerText.setColor('#ff0000');
        this.timerText.setShadow(0, 0, 'rgba(255, 0, 0, 0.5)', 5, true, false);
    }

    updateTimer() {
        if (!this.timerActive) return;
        
        this.timerCountdown--;
        this.timerText.setText(`⏱ ${this.timerCountdown}s`);
        
        if (this.timerCountdown <= 5) {
            this.timerText.setColor('#ff0000');
            this.timerText.setShadow(0, 0, 'rgba(255, 0, 0, 0.7)', 8, true, false);
        } else if (this.timerCountdown <= 10) {
            this.timerText.setColor('#ff9900');
            this.timerText.setShadow(0, 0, 'rgba(255, 153, 0, 0.5)', 5, true, false);
        } else {
            this.timerText.setColor('#00ff00');
            this.timerText.setShadow(0, 0, 'rgba(0, 255, 0, 0.5)', 5, true, false);
        }
        
        if (this.timerCountdown <= 0) {
            console.log("failed");
            this.stopTimer();
            
            this.cameras.main.shake(300, 0.01);
            this.showStatus('Čas je potekel! Naloga ni bila rešena.', '#ff0000', 3000);
            
            const flash = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xff0000, 0.2)
                .setOrigin(0)
                .setDepth(999);
            
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 500,
                onComplete: () => flash.destroy()
            });
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

        this.previewLine.lineStyle(4, 0x00ffcc, 0.8);
        this.previewLine.lineStyle(6, 0x00ffcc, 0.3);
        
        const midX = fromX + (toX - fromX) / 2;
        this.previewLine.beginPath();
        this.previewLine.moveTo(fromX, fromY);
        this.previewLine.lineTo(midX, fromY);
        this.previewLine.lineTo(midX, toY);
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
        } catch (e) {}

        try {
            (this.placedComponents || []).forEach(c => {
                if (c.getData('isBulb')) {
                    const gate = c.getData('logicGate');
                    const label = c.getData('labelTextObj');
                    const displayName = c.getData('displayName') || 'OUTPUT';
                    if (gate && label) {
                        const val = !!gate.getOutput();
                        const color = val ? '#00ff00' : '#ff0000';
                        label.setText(`${displayName} = ${val ? 'ON' : 'OFF'}`);
                        label.setStyle({ color });
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
            
            const tooltipBg = this.add.graphics()
                .fillStyle(0x000000, 0.9)
                .fillRoundedRect(pinWorldX - 40, pinWorldY - 35, 80, 30, 5)
                .lineStyle(2, 0x00ffcc, 1)
                .strokeRoundedRect(pinWorldX - 40, pinWorldY - 35, 80, 30, 5)
                .setDepth(1000);

            const tooltipText = this.add.text(pinWorldX, pinWorldY - 20, pinValue ? 'TRUE' : 'FALSE', {
                fontSize: '16px',
                color: pinValue ? '#00ff00' : '#ff5555',
                fontStyle: 'bold',
                fontFamily: 'Arial, sans-serif'
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

    snapToGrid(x, y) {
        const startX = this.gridStartX || 220;
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
            this.checkText.setText(`Ne morete povezati ${sourceIsOutput ? 'dveh izhodov' : 'dveh vhodov'}`);
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
            
            this.cameras.main.shake(50, 0.005);
            
            const fromPin = sourceIsOutput ? sourcePin : targetPin;
            const toPin = sourceIsOutput ? targetPin : sourcePin;
            const fromContainer = sourceIsOutput ? sourceContainer : targetContainer;
            const toContainer = sourceIsOutput ? targetContainer : sourceContainer;

            const fromX = fromContainer.x + (fromPin ? fromPin.x : 36);
            const fromY = fromContainer.y + (fromPin ? fromPin.y : 0);
            const toX = toContainer.x + (toPin ? toPin.x : -36);
            const toY = toContainer.y + (toPin ? toPin.y : 0);

            this.drawConnectionWithBend(fromX, fromY, toX, toY, finalSourceId, finalTargetId, toPinIndex);
            
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
        } else {
            this.checkText.setText('Povezava ni mogoča');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
        }

        this.cancelConnection();
    }

    drawConnectionWithBend(fromX, fromY, toX, toY, fromId, toId, toPinIndex) {
        const gfx = this.add.graphics();
        
        gfx.lineStyle(4, 0x00aaff, 1);
        
        const glow = this.add.graphics();
        glow.lineStyle(8, 0x00aaff, 0.3);
        glow.setDepth(9);
        
        const gridSize = this.gridSize;
        const snapX1 = Math.round(fromX / gridSize) * gridSize;
        const snapY1 = Math.round(fromY / gridSize) * gridSize;
        const snapX2 = Math.round(toX / gridSize) * gridSize;
        const snapY2 = Math.round(toY / gridSize) * gridSize;
        
        const midX = Math.round((fromX + toX) / 2 / gridSize) * gridSize;
        
        glow.beginPath();
        glow.moveTo(fromX, fromY);
        glow.lineTo(midX, fromY);
        glow.lineTo(midX, toY);
        glow.lineTo(toX, toY);
        glow.strokePath();

        gfx.beginPath();
        gfx.moveTo(fromX, fromY);
        gfx.lineTo(midX, fromY);
        gfx.lineTo(midX, toY);
        gfx.lineTo(toX, toY);
        gfx.strokePath();
        gfx.setDepth(10);

        const midPointX = fromX + (midX - fromX) / 2;
        const midPointY = fromY + (toY - fromY) / 2;
        
        const hit = this.add.zone(midPointX, midPointY, Math.max(40, Math.abs(toX - fromX) / 2), 20)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
            
        hit.on('pointerover', () => {
            gfx.clear();
            glow.clear();
            gfx.lineStyle(4, 0xffcc00, 1);
            glow.lineStyle(8, 0xffcc00, 0.3);
            
            gfx.beginPath();
            gfx.moveTo(fromX, fromY);
            gfx.lineTo(midX, fromY);
            gfx.lineTo(midX, toY);
            gfx.lineTo(toX, toY);
            gfx.strokePath();
            
            glow.beginPath();
            glow.moveTo(fromX, fromY);
            glow.lineTo(midX, fromY);
            glow.lineTo(midX, toY);
            glow.lineTo(toX, toY);
            glow.strokePath();
        });
        
        hit.on('pointerout', () => {
            gfx.clear();
            glow.clear();
            gfx.lineStyle(4, 0x00aaff, 1);
            glow.lineStyle(8, 0x00aaff, 0.3);
            
            gfx.beginPath();
            gfx.moveTo(fromX, fromY);
            gfx.lineTo(midX, fromY);
            gfx.lineTo(midX, toY);
            gfx.lineTo(toX, toY);
            gfx.strokePath();
            
            glow.beginPath();
            glow.moveTo(fromX, fromY);
            glow.lineTo(midX, fromY);
            glow.lineTo(midX, toY);
            glow.lineTo(toX, toY);
            glow.strokePath();
        });
        
        hit.on('pointerdown', () => {
            this.cameras.main.shake(100, 0.01);
            
            try {
                const srcGate = this.logicCircuit.getGate(fromId);
                const dstGate = this.logicCircuit.getGate(toId);
                if (srcGate && dstGate) srcGate.disconnectFrom(dstGate);
            } catch (e) { }
            
            try { gfx.destroy(); } catch (e) {}
            try { glow.destroy(); } catch (e) {}
            try { hit.destroy(); } catch (e) {}
            
            this.connections = this.connections.filter(c => !(c.fromId === fromId && c.toId === toId && c.toPinIndex === toPinIndex));
            
            this.checkText.setText('🔌 Povezava odstranjena');
            this.time.delayedCall(1000, () => this._origCheckTextSet(''));
        });

        this.connections.push({ fromId, toId, fromPinIndex: 0, toPinIndex, gfx, glow, hitZone: hit });
    }

    setupInputOutputPins(container, type, labelText, img) {
        const pinRadius = 8;
        const inputPinColor = 0xff5555;
        const outputPinColor = 0x55ff55;
        const highlightColor = 0xffff00;
        
        let maxInputs = 2;
        if (type === 'not' || type === 'bulb') maxInputs = 1;
        if (type === 'input') maxInputs = 0;

        let inputPins = container.getData('inputPins') || [];
        if (!inputPins || inputPins.length === 0) {
            inputPins = [];

            for (let i = 0; i < maxInputs; i++) {
                const yOff = (maxInputs === 1) ? 0 : (i === 0 ? -10 : 10);
                const inPin = this.add.circle(-36, yOff, pinRadius, inputPinColor)
                    .setStrokeStyle(2, 0xffffff, 0.8)
                    .setOrigin(0.5);
                inPin.setInteractive({ useHandCursor: true });

                inPin.on('pointerdown', (pointer, localX, localY, event) => {
                    if (event && event.stopPropagation) event.stopPropagation();
                    
                    if (!this.connectingPin) {
                        this.connectingPin = { pinObject: inPin, container, isOutput: false };
                        inPin.setStrokeStyle(3, highlightColor, 1);
                        this.checkText.setText('🔌 Izberi izhod za povezavo');
                        return;
                    }

                    if (this.connectingPin.pinObject === inPin) {
                        this.cancelConnection();
                        return;
                    }

                    this.completeConnection(inPin, container, false);
                });

                inPin.on('pointerover', () => {
                    inPin.setScale(1.2);
                    this.showPinTooltip(inPin, container, false);
                });
                inPin.on('pointerout', () => {
                    inPin.setScale(1);
                    this.hidePinTooltip();
                });
                container.add(inPin);
                inputPins.push(inPin);
            }
        }
        let outputPin = container.getData('outputPin') || null;
        if (type !== 'bulb' && !outputPin) {
            outputPin = this.add.circle(36, 0, pinRadius, outputPinColor)
                .setStrokeStyle(2, 0xffffff, 0.8)
                .setOrigin(0.5);
            outputPin.setInteractive({ useHandCursor: true });
            outputPin.on('pointerdown', (pointer, localX, localY, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                
                if (!this.connectingPin) {
                    this.connectingPin = { pinObject: outputPin, container, isOutput: true };
                    outputPin.setStrokeStyle(3, highlightColor, 1);
                    this.checkText.setText('🔌 Izberi vhod za povezavo');
                    return;
                }
                if (this.connectingPin.pinObject === outputPin) {
                    this.cancelConnection();
                    return;
                }
                this.completeConnection(outputPin, container, true);
            });

            outputPin.on('pointerover', () => {
                outputPin.setScale(1.2);
                this.showPinTooltip(outputPin, container, true);
            });
            outputPin.on('pointerout', () => {
                outputPin.setScale(1);
                this.hidePinTooltip();
            });
            container.add(outputPin);
        }

        container.setData('inputPins', inputPins);
        container.setData('outputPin', outputPin);
    }

    createComponent(x, y, type, labelText, color) {
        const container = this.add.container(x, y);
        container.setDepth(5);

        const size = 72;
        const textureName = this.getTextureName(type);
        
        const glow = this.add.circle(0, 0, size / 2 + 5, color, 0.2);
        container.add(glow);
        
        const img = this.add.image(0, 0, textureName)
            .setDisplaySize(size, size)
            .setOrigin(0.5);
        container.add(img);
        container.setData('img', img);

        const label = this.add.text(0, 40, labelText || type, { 
            fontSize: '14px', 
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: { x: 8, y: 4 },
            borderRadius: 4,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        label.setShadow(1, 1, 'rgba(0, 0, 0, 0.5)', 2, true, false);
        container.add(label);

        container.setSize(64, 64);
        container.setInteractive({ draggable: true, useHandCursor: true });
        container.setData('originalX', x);
        container.setData('originalY', y);
        container.setData('type', type);
        container.setData('isInPanel', true);

        this.input.setDraggable(container);
        
        container.on('pointerover', () => {
            if (container.getData('isInPanel')) {
                container.setScale(1.1);
                glow.setAlpha(0.4);
            }
        });
        
        container.on('pointerout', () => {
            if (container.getData('isInPanel')) {
                container.setScale(1);
                glow.setAlpha(0.2);
            }
        });

        container.on('dragstart', () => { 
            container.setData('isDragging', true);
            container.setScale(1.05);
        });

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
            const isInPanel = container.x < (this.gridStartX || 220);
            if (isInPanel && !container.getData('isInPanel')) {
                this.returnComponentToPanel(container);
            } else if (!isInPanel && container.getData('isInPanel')) {
                this.placeComponentOnGrid(container, type, labelText);
            } else if (!container.getData('isInPanel')) {
                const snapped = this.snapToGrid(container.x, container.y);
                container.x = snapped.x; 
                container.y = snapped.y;
                this.updateConnectionsForGate(container.getData('gateId'));
            } else {
                container.x = container.getData('originalX'); 
                container.y = container.getData('originalY');
            }

            container.setScale(1);
            this.time.delayedCall(200, () => container.setData('isDragging', false));
        });

        container.on('pointerdown', (pointer) => {
            if (container.getData('isInPanel')) return;

            const now = Date.now();
            const last = container.getData('lastClick') || 0;
            if (now - last < 300) {
                if (container.getData('type') === 'input') {
                    this.toggleInputSwitch(container);
                }
                container.setData('lastClick', 0);
                return;
            }
            container.setData('lastClick', now);
        });
    }

    getTextureName(type) {
        switch (type) {
            case 'bulb': return 'BULB';
            case 'and': return 'AND';
            case 'or': return 'OR';
            case 'not': return 'NOT';
            case 'nand': return 'NAND';
            case 'nor': return 'NOR';
            case 'xor': return 'XOR';
            case 'xnor': return 'XNOR';
            case 'input': return 'SWITCH_ON';
            default: return 'AND';
        }
    }

    returnComponentToPanel(container) {
        const gateId = container.getData('gateId');
        
        if (this.connectingSource === container) this.connectingSource = null;

        try {
            this.connections = this.connections.filter(conn => {
                if (conn.fromId === gateId || conn.toId === gateId) {
                    try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { }
                    try { if (conn.glow) conn.glow.destroy(); } catch (e) { }
                    try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { }
                    return false;
                }
                return true;
            });
        } catch (e) { }

        try { 
            if (this.logicCircuit && typeof this.logicCircuit.removeGate === 'function') {
                this.logicCircuit.removeGate(gateId); 
            }
        } catch (e) { }

        try { 
            this.placedComponents = this.placedComponents.filter(c => c !== container); 
        } catch (e) { }

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
    }

    placeComponentOnGrid(container, type, labelText) {
        const snapped = this.snapToGrid(container.x, container.y);
        container.x = snapped.x; 
        container.y = snapped.y;

        const id = `${type}_${this.getRandomInt(1000, 9999)}`;
        let gateType = this.getGateType(type);
        
        const gate = this.logicCircuit.addGate(gateType, id);
        container.setData('logicGate', gate);
        container.setData('gateId', id);
        container.setData('labelTextObj', container.list[2]);

        if (type === 'input') {
            container.setData('inputValue', true);
            let idx = 1;
            while (this.inputIndices.has(idx)) idx++;
            this.inputIndices.add(idx);
            const inputName = `INPUT ${idx}`;
            container.setData('displayName', inputName);
            container.setData('displayIndex', idx);
            container.list[2].setText(`${inputName} = ON`);
            container.list[2].setColor('#00ff00');
        }

        if (type === 'bulb') {
            container.setData('isBulb', true);
            let bidx = 1;
            while (this.bulbIndices.has(bidx)) bidx++;
            this.bulbIndices.add(bidx);
            const displayName = `OUTPUT ${bidx}`;
            container.list[2].setText(displayName);
            container.setData('displayName', displayName);
            container.setData('displayIndex', bidx);
        }

        container.setData('isInPanel', false);
        container.setDepth(20);
        
        container.list[0].setAlpha(0);

        this.setupInputOutputPins(container, type, labelText, container.list[1]);
        this.placedComponents.push(container);

        this.createComponent(container.getData('originalX'), container.getData('originalY'), container.getData('type'), labelText, 0xffffff);
    }

    getGateType(type) {
        switch (type) {
            case 'input': return GateTypes.input;
            case 'and': return GateTypes.and;
            case 'or': return GateTypes.or;
            case 'not': return GateTypes.not;
            case 'nand': return GateTypes.nand;
            case 'nor': return GateTypes.nor;
            case 'xor': return GateTypes.xor;
            case 'xnor': return GateTypes.xnor;
            case 'bulb': return GateTypes.bulb;
            default: return GateTypes.and;
        }
    }

    toggleInputSwitch(container) {
        const gate = container.getData('logicGate');
        const current = container.getData('inputValue') === undefined ? true : container.getData('inputValue');
        const newVal = !current;
        
        if (gate && gate.setValue) gate.setValue(newVal);

        container.setData('inputValue', newVal);
        const inputName = container.getData('displayName') || `INPUT`;
        const label = container.list[2];
        label.setText(`${inputName} = ${newVal ? 'ON' : 'OFF'}`);
        label.setColor(newVal ? '#00ff00' : '#ff0000');
        
        this.checkText.setText(`${inputName} = ${newVal ? 'ON' : 'OFF'}`);
        this.time.delayedCall(1200, () => this._origCheckTextSet(''));

        this.cameras.main.shake(30, 0.002);
        
        const img = container.list[1];
        img.setTexture(newVal ? 'SWITCH_ON' : 'SWITCH_OFF');
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
                    bulbEntries.push(`${name}: ${val ? 'ON 🟢' : 'OFF 🔴'}`);
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
                        label.setText(`${displayName} = ${val ? 'ON' : 'OFF'}`);
                        label.setColor(val ? '#00ff00' : '#ff0000');
                    }
                }
            });
        } catch (e) { }

        let taskCompleted = false;
        try {
            taskCompleted = this.checkCurrentTaskCompletion();
        } catch (e) { }

        const statusText = bulbEntries.length > 0 ? `📊 ${bulbEntries.join(' | ')}` : 'No OUTPUT present';

        if (taskCompleted && this.tasks && this.tasks[this.currentTaskIndex] && !this.tasks[this.currentTaskIndex].completed) {
            this.tasks[this.currentTaskIndex].completed = true;
            this.addPoints(this.tasks[this.currentTaskIndex].points);
            
            this.cameras.main.shake(200, 0.01);
            this.showStatus(`🎉 ${statusText} — Naloga opravljena! +${this.tasks[this.currentTaskIndex].points} točk`, '#00ff00', 2500);
            
            this.time.delayedCall(1500, () => this.nextTask());
        } else {
            const taskMsg = (this.tasks && this.tasks[this.currentTaskIndex] && this.tasks[this.currentTaskIndex].completed) 
                ? 'Naloga opravljena!' 
                : 'Naloga ni opravljena';
            const color = (taskMsg.includes('opravljena')) ? '#00aa00' : '#cc0000';
            this.showStatus(`${statusText} — ${taskMsg}`, color, 2000);
            try { 
                this.time.delayedCall(2000, () => { 
                    try { 
                        this._origCheckTextSet(''); 
                        this.checkText.setStyle({ 
                            color: '#ffffff',
                            backgroundColor: 'rgba(0, 20, 40, 0.8)'
                        }); 
                    } catch (e) {} 
                }); 
            } catch (e) {}
        }
    }

    checkCurrentTaskCompletion() {
        if (!this.tasks || this.currentTaskIndex == null) return false;
        const task = this.tasks[this.currentTaskIndex];
        if (!task) return false;

        try { 
            if (this.logicCircuit && typeof this.logicCircuit.evaluate === 'function') {
                this.logicCircuit.evaluate(); 
            }
        } catch (e) { }

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
                        this.showStatus('✅ Naloga opravljena!', '#00aa00', 2000);
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
                            this.showStatus('✅ Naloga opravljena!', '#00aa00', 2000);
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
                            this.showStatus('✅ Naloga opravljena!', '#00aa00', 2000);
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
            this.showStatus('Čestitke! Vse naloge opravljene!', '#00ffcc', 3000);
            try { this.addPoints(50); } catch (e) {}
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
                try { if (conn.glow) conn.glow.destroy(); } catch (e) { }
                try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { }
            });
        }
        this.connections = [];
        this.logicCircuit = new LogicCircuit();
        try { this.inputIndices = new Set(); } catch (e) {}
        try { this.bulbIndices = new Set(); } catch (e) {}
        this._origCheckTextSet('🔄 Workspace reset');
        this.time.delayedCall(1500, () => this._origCheckTextSet(''));
    }

    deleteGate(container, gateId) {
        try {
            this.connections = this.connections.filter(conn => {
                if (conn.fromId === gateId || conn.toId === gateId) {
                    try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { }
                    try { if (conn.glow) conn.glow.destroy(); } catch (e) { }
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

            this.cameras.main.shake(100, 0.01);
            
            container.destroy();

            this.checkText.setText('Vrata izbrisana');
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

                    const midX = Math.round((fromX + toX) / 2 / this.gridSize) * this.gridSize;
                    
                    if (conn.glow) {
                        conn.glow.clear();
                        conn.glow.lineStyle(8, 0x00aaff, 0.3);
                        conn.glow.beginPath();
                        conn.glow.moveTo(fromX, fromY);
                        conn.glow.lineTo(midX, fromY);
                        conn.glow.lineTo(midX, toY);
                        conn.glow.lineTo(toX, toY);
                        conn.glow.strokePath();
                    }
                    
                    conn.gfx.clear();
                    conn.gfx.lineStyle(4, 0x00aaff, 1);
                    conn.gfx.beginPath();
                    conn.gfx.moveTo(fromX, fromY);
                    conn.gfx.lineTo(midX, fromY);
                    conn.gfx.lineTo(midX, toY);
                    conn.gfx.lineTo(toX, toY);
                    conn.gfx.strokePath();

                    if (conn.hitZone) {
                        const midPointX = fromX + (midX - fromX) / 2;
                        const midPointY = fromY + (toY - fromY) / 2;
                        
                        conn.hitZone.setPosition(midPointX, midPointY);
                        conn.hitZone.setSize(Math.max(40, Math.abs(toX - fromX) / 2), 20);
                    }
                }
            }
        });
    }
}
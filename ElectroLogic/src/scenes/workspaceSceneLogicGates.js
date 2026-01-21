import Phaser from 'phaser';
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
        this.timerCountdown = 180;
        this.timerText = this.add.text(width - 120, 30, `⏱ ${this.formatTime(this.timerCountdown)}`, {
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
            } catch (e) { }

            try {
                this.checkText.setStyle({
                    color,
                    backgroundColor: 'rgba(0, 20, 40, 0.9)'
                });
            } catch (e) { }

            try {
                this._origCheckTextSet(text);
            } catch (e) { }

            let delay = holdMs;
            try {
                if (this._suppressCheckTextClearUntil && this._suppressCheckTextClearUntil > Date.now()) {
                    const remaining = this._suppressCheckTextClearUntil - Date.now();
                    delay = Math.max(delay, remaining + 50);
                }
            } catch (e) { }

            try {
                this._checkTextTimer = this.time.delayedCall(delay, () => {
                    try {
                        this._origCheckTextSet('');
                        this.checkText.setStyle({
                            color: '#ffffff',
                            backgroundColor: 'rgba(0, 20, 40, 0.8)'
                        });
                    } catch (e) { }
                    this._checkTextTimer = null;
                });
            } catch (e) { }
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
        this.bulbGlows = new Map();

        this.challenges = [
            {
                id: 'challenge_1',
                prompt: 'Naloga 1: Ustvari vezje, kjer je izhod prižgan, če sta oba vhoda prižgana',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const input1 = inputs[0];
                    const input2 = inputs[1];

                    const testCases = [
                        { a: true, b: true, expected: true },
                        { a: false, b: true, expected: false },
                        { a: true, b: false, expected: false },
                        { a: false, b: false, expected: false }
                    ];

                    for (const test of testCases) {
                        input1.setValue(test.a);
                        input2.setValue(test.b);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_2',
                prompt: 'Naloga 2: Ustvari vezje, kjer je izhod prižgan, če je vsaj en vhod prižgan',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const input1 = inputs[0];
                    const input2 = inputs[1];

                    const testCases = [
                        { a: true, b: true, expected: true },
                        { a: false, b: true, expected: true },
                        { a: true, b: false, expected: true },
                        { a: false, b: false, expected: false }
                    ];

                    for (const test of testCases) {
                        input1.setValue(test.a);
                        input2.setValue(test.b);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_3',
                prompt: 'Naloga 3: Ustvari vezje XOR (izhod prižgan, če sta vhoda različna)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const input1 = inputs[0];
                    const input2 = inputs[1];

                    const testCases = [
                        { a: true, b: true, expected: false },
                        { a: false, b: true, expected: true },
                        { a: true, b: false, expected: true },
                        { a: false, b: false, expected: false }
                    ];

                    for (const test of testCases) {
                        input1.setValue(test.a);
                        input2.setValue(test.b);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_4',
                prompt: 'Naloga 4: Ustvari pol-seštevalnik (vsota in prenos) z uporabo AND in XOR vrat',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length < 2) return false;

                    const sortedBulbs = bulbs.sort((a, b) => {
                        const aContainer = this.placedComponents.find(c => c.getData('gateId') === a.id);
                        const bContainer = this.placedComponents.find(c => c.getData('gateId') === b.id);
                        const aIdx = aContainer ? aContainer.getData('displayIndex') || 0 : 0;
                        const bIdx = bContainer ? bContainer.getData('displayIndex') || 0 : 0;
                        return aIdx - bIdx;
                    });

                    const sumBulb = sortedBulbs[0];
                    const carryBulb = sortedBulbs[1];

                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const A = inputs[0];
                    const B = inputs[1];

                    const testCases = [
                        { a: false, b: false, sum: false, carry: false },
                        { a: false, b: true, sum: true, carry: false },
                        { a: true, b: false, sum: true, carry: false },
                        { a: true, b: true, sum: false, carry: true }
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        circuit.evaluate();

                        if (sumBulb.getOutput() !== test.sum) return false;
                        if (carryBulb.getOutput() !== test.carry) return false;
                    }

                    return true;
                }
            },
            {
                id: 'challenge_5',
                prompt: 'Naloga 5: Ustvari vezje, ki invertira vhod (NOT)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 1) return false;

                    const input = inputs[0];

                    const testCases = [
                        { a: true, expected: false },
                        { a: false, expected: true }
                    ];

                    for (const test of testCases) {
                        input.setValue(test.a);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_6',
                prompt: 'Naloga 6: Ustvari NAND z uporabo AND in NOT vrat',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const input1 = inputs[0];
                    const input2 = inputs[1];

                    const testCases = [
                        { a: true, b: true, expected: false },
                        { a: false, b: true, expected: true },
                        { a: true, b: false, expected: true },
                        { a: false, b: false, expected: true }
                    ];

                    for (const test of testCases) {
                        input1.setValue(test.a);
                        input2.setValue(test.b);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_7',
                prompt: 'Naloga 7: Ustvari 3-vhodno AND vezje',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 3) return false;

                    const [A, B, C] = inputs;

                    const testCases = [
                        { a: true, b: true, c: true, expected: true },
                        { a: false, b: true, c: true, expected: false },
                        { a: true, b: false, c: true, expected: false },
                        { a: true, b: true, c: false, expected: false },
                        { a: false, b: false, c: true, expected: false },
                        { a: true, b: false, c: false, expected: false },
                        { a: false, b: true, c: false, expected: false },
                        { a: false, b: false, c: false, expected: false }
                    ];

                    const criticalTests = [
                        testCases[0],
                        testCases[1],
                        testCases[2],
                        testCases[3]
                    ];

                    for (const test of criticalTests) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        C.setValue(test.c);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_8',
                prompt: 'Naloga 8: Ustvari pol-seštevalnik (vsota in prenos) z uporabo AND in XOR vrat',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length < 2) return false;

                    const sortedBulbs = bulbs.sort((a, b) => {
                        const aContainer = this.placedComponents.find(c => c.getData('gateId') === a.id);
                        const bContainer = this.placedComponents.find(c => c.getData('gateId') === b.id);
                        const aIdx = aContainer ? aContainer.getData('displayIndex') || 0 : 0;
                        const bIdx = bContainer ? bContainer.getData('displayIndex') || 0 : 0;
                        return aIdx - bIdx;
                    });

                    const sumBulb = sortedBulbs[0];
                    const carryBulb = sortedBulbs[1];

                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const A = inputs[0];
                    const B = inputs[1];

                    const testCases = [
                        { a: false, b: false, sum: false, carry: false },
                        { a: false, b: true, sum: true, carry: false },
                        { a: true, b: false, sum: true, carry: false },
                        { a: true, b: true, sum: false, carry: true }
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        circuit.evaluate();

                        if (sumBulb.getOutput() !== test.sum) return false;
                        if (carryBulb.getOutput() !== test.carry) return false;
                    }

                    return true;
                }
            },
            {
                id: 'challenge_9',
                prompt: 'Naloga 9: Ustvari XOR samo z uporabo NAND vrat (brez XOR, AND, OR, NOT)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const input1 = inputs[0];
                    const input2 = inputs[1];

                    for (const [id, gate] of circuit.gates) {
                        if (gate.operation === 'XOR' || gate.operation === 'AND' || 
                            gate.operation === 'OR' || gate.operation === 'NOT') {
                            return false;
                        }
                    }

                    const testCases = [
                        { a: true, b: true, expected: false },
                        { a: false, b: true, expected: true },
                        { a: true, b: false, expected: true },
                        { a: false, b: false, expected: false }
                    ];

                    for (const test of testCases) {
                        input1.setValue(test.a);
                        input2.setValue(test.b);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_10',
                prompt: 'Naloga 10: Ustvari 4-vhodno glasovalno vezje (izhod ON, če so vsaj 3 vhodi ON)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 4) return false;

                    const [A, B, C, D] = inputs;

                    const testCases = [
                        { a: true, b: true, c: true, d: true, expected: true },
                        { a: false, b: true, c: true, d: true, expected: true },
                        { a: true, b: false, c: true, d: true, expected: true },
                        { a: true, b: true, c: false, d: true, expected: true },
                        { a: true, b: true, c: true, d: false, expected: true },
                        { a: true, b: true, c: false, d: false, expected: false },
                        { a: true, b: false, c: true, d: false, expected: false },
                        { a: true, b: false, c: false, d: false, expected: false },
                        { a: false, b: false, c: false, d: false, expected: false }
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        C.setValue(test.c);
                        D.setValue(test.d);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_11',
                prompt: 'Naloga 11: Ustvari popolni seštevalnik (3 vhodi: A, B, Cin; izhoda: vsota in Cout)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length < 2) return false;

                    const sortedBulbs = bulbs.sort((a, b) => {
                        const aContainer = this.placedComponents.find(c => c.getData('gateId') === a.id);
                        const bContainer = this.placedComponents.find(c => c.getData('gateId') === b.id);
                        const aIdx = aContainer ? aContainer.getData('displayIndex') || 0 : 0;
                        const bIdx = bContainer ? bContainer.getData('displayIndex') || 0 : 0;
                        return aIdx - bIdx;
                    });

                    const sumBulb = sortedBulbs[0];
                    const carryBulb = sortedBulbs[1];

                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 3) return false;

                    const [A, B, Cin] = inputs;

                    const testCases = [
                        { a: false, b: false, cin: false, sum: false, cout: false },
                        { a: false, b: false, cin: true, sum: true, cout: false },
                        { a: false, b: true, cin: false, sum: true, cout: false },
                        { a: false, b: true, cin: true, sum: false, cout: true },
                        { a: true, b: false, cin: false, sum: true, cout: false },
                        { a: true, b: false, cin: true, sum: false, cout: true },
                        { a: true, b: true, cin: false, sum: false, cout: true },
                        { a: true, b: true, cin: true, sum: true, cout: true }
                    ];

                    const criticalTests = [
                        testCases[0], testCases[1], testCases[2], testCases[3],
                        testCases[4], testCases[6], testCases[7]
                    ];

                    for (const test of criticalTests) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        Cin.setValue(test.cin);
                        circuit.evaluate();

                        if (sumBulb.getOutput() !== test.sum) return false;
                        if (carryBulb.getOutput() !== test.cout) return false;
                    }

                    return true;
                }
            },
            {
                id: 'challenge_12',
                prompt: 'Naloga 12: Ustvari enobitni komparator (A > B, A = B, A < B)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length < 3) return false;

                    const sortedBulbs = bulbs.sort((a, b) => {
                        const aContainer = this.placedComponents.find(c => c.getData('gateId') === a.id);
                        const bContainer = this.placedComponents.find(c => c.getData('gateId') === b.id);
                        const aIdx = aContainer ? aContainer.getData('displayIndex') || 0 : 0;
                        const bIdx = bContainer ? bContainer.getData('displayIndex') || 0 : 0;
                        return aIdx - bIdx;
                    });

                    const greaterBulb = sortedBulbs[0];   
                    const equalBulb = sortedBulbs[1];      
                    const lessBulb = sortedBulbs[2];     

                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 2) return false;

                    const A = inputs[0];
                    const B = inputs[1];

                    const testCases = [
                        { a: false, b: false, greater: false, equal: true, less: false },
                        { a: false, b: true, greater: false, equal: false, less: true },
                        { a: true, b: false, greater: true, equal: false, less: false },
                        { a: true, b: true, greater: false, equal: true, less: false }
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        circuit.evaluate();

                        if (greaterBulb.getOutput() !== test.greater) return false;
                        if (equalBulb.getOutput() !== test.equal) return false;
                        if (lessBulb.getOutput() !== test.less) return false;
                    }

                    return true;
                }
            },
            {
                id: 'challenge_13',
                prompt: 'Naloga 13: Ustvari 2-na-1 multipleksor (izbira med vhodoma A in B z izbirnim vhodom S)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 3) return false;

                    const [A, B, S] = inputs;

                    const testCases = [
                        { a: false, b: false, s: false, expected: false },
                        { a: false, b: false, s: true, expected: false },
                        { a: true, b: false, s: false, expected: true },
                        { a: true, b: false, s: true, expected: false },
                        { a: false, b: true, s: false, expected: false },
                        { a: false, b: true, s: true, expected: true },
                        { a: true, b: true, s: false, expected: true },
                        { a: true, b: true, s: true, expected: true }
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        S.setValue(test.s);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_14',
                prompt: 'Naloga 14: Ustvari pariteto (izhod ON, če je liho število vhodov ON)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 3) return false;

                    const [A, B, C] = inputs;

                    const testCases = [
                        { a: true, b: false, c: false, expected: true },  
                        { a: false, b: true, c: false, expected: true },  
                        { a: false, b: false, c: true, expected: true }, 
                        { a: true, b: true, c: true, expected: true },  
                        { a: false, b: false, c: false, expected: false },
                        { a: true, b: true, c: false, expected: false }, 
                        { a: true, b: false, c: true, expected: false }, 
                        { a: false, b: true, c: true, expected: false } 
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        C.setValue(test.c);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_15',
                prompt: 'Naloga 15: Ustvari vezje za preverjanje pravilnosti 2-bitnega seštevanja (A1A0 + B1B0 = S1S0)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 4) return false;

                    const [A1, A0, B1, B0] = inputs;

                    const testCases = [
                        { a1: false, a0: false, b1: false, b0: false, expected: true },
                        { a1: false, a0: true, b1: true, b0: false, expected: true },
                        { a1: true, a0: true, b1: false, b0: true, expected: false },
                        { a1: true, a0: false, b1: true, b0: false, expected: false },
                        { a1: false, a0: true, b1: false, b0: true, expected: true }
                    ];

                    for (const test of testCases) {
                        A1.setValue(test.a1);
                        A0.setValue(test.a0);
                        B1.setValue(test.b1);
                        B0.setValue(test.b0);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            {
                id: 'challenge_16',
                prompt: 'Naloga 16: Ustvari vezje, ki implementira funkcijo F = (A AND B) OR (NOT C)',
                solutionCheck: (circuit) => {
                    const bulbs = this.getOutputGates(circuit);
                    if (bulbs.length === 0) return false;

                    const bulb = bulbs[0];
                    const inputs = this.getInputGates(circuit);
                    if (inputs.length < 3) return false;

                    const [A, B, C] = inputs;

                    const testCases = [
                        { a: false, b: false, c: false, expected: true },
                        { a: false, b: false, c: true, expected: false },
                        { a: false, b: true, c: false, expected: true },
                        { a: false, b: true, c: true, expected: false },
                        { a: true, b: false, c: false, expected: true },
                        { a: true, b: false, c: true, expected: false },
                        { a: true, b: true, c: false, expected: true },
                        { a: true, b: true, c: true, expected: true }
                    ];

                    for (const test of testCases) {
                        A.setValue(test.a);
                        B.setValue(test.b);
                        C.setValue(test.c);
                        circuit.evaluate();

                        if (bulb.getOutput() !== test.expected) {
                            return false;
                        }
                    }

                    return true;
                }
            }
        ];

        const sX = 600;
        const sY = 600;

        this.challengeSolutions = [
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const input1 = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT 1');
                const input2 = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT 2');
                
                const andGate = this.createGateOnGrid(startX + 150, startY, 'and', 'AND');
                
                const outputBulb = this.createGateOnGrid(startX + 300, startY, 'bulb', 'OUTPUT 1');
                
                this.connectGates(input1.getData('gateId'), andGate.getData('gateId'), 0);
                this.connectGates(input2.getData('gateId'), andGate.getData('gateId'), 1);
                
                this.connectGates(andGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const input1 = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT 1');
                const input2 = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT 2');
                const orGate = this.createGateOnGrid(startX + 150, startY, 'or', 'OR');
                const outputBulb = this.createGateOnGrid(startX + 300, startY, 'bulb', 'OUTPUT 1');
                
                this.connectGates(input1.getData('gateId'), orGate.getData('gateId'), 0);
                this.connectGates(input2.getData('gateId'), orGate.getData('gateId'), 1);
                this.connectGates(orGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const input1 = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT 1');
                const input2 = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT 2');
                const xorGate = this.createGateOnGrid(startX + 150, startY, 'xor', 'XOR');
                const outputBulb = this.createGateOnGrid(startX + 300, startY, 'bulb', 'OUTPUT 1');
                
                this.connectGates(input1.getData('gateId'), xorGate.getData('gateId'), 0);
                this.connectGates(input2.getData('gateId'), xorGate.getData('gateId'), 1);
                this.connectGates(xorGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT B');
                
                const xorGate = this.createGateOnGrid(startX + 150, startY - 50, 'xor', 'XOR');
                const andGate = this.createGateOnGrid(startX + 150, startY + 50, 'and', 'AND');
                
                const sumBulb = this.createGateOnGrid(startX + 300, startY - 50, 'bulb', 'SUM');
                const carryBulb = this.createGateOnGrid(startX + 300, startY + 50, 'bulb', 'CARRY');
                
                this.connectGates(inputA.getData('gateId'), xorGate.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), xorGate.getData('gateId'), 1);
                this.connectGates(inputA.getData('gateId'), andGate.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), andGate.getData('gateId'), 1);
                this.connectGates(xorGate.getData('gateId'), sumBulb.getData('gateId'), 0);
                this.connectGates(andGate.getData('gateId'), carryBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const input = this.createGateOnGrid(startX, startY, 'input', 'INPUT');
                const notGate = this.createGateOnGrid(startX + 150, startY, 'not', 'NOT');
                const outputBulb = this.createGateOnGrid(startX + 300, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(input.getData('gateId'), notGate.getData('gateId'), 0);
                this.connectGates(notGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const input1 = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT 1');
                const input2 = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT 2');
                const andGate = this.createGateOnGrid(startX + 150, startY, 'and', 'AND');
                const notGate = this.createGateOnGrid(startX + 300, startY, 'not', 'NOT');
                const outputBulb = this.createGateOnGrid(startX + 450, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(input1.getData('gateId'), andGate.getData('gateId'), 0);
                this.connectGates(input2.getData('gateId'), andGate.getData('gateId'), 1);
                this.connectGates(andGate.getData('gateId'), notGate.getData('gateId'), 0);
                this.connectGates(notGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const input1 = this.createGateOnGrid(startX, startY - 80, 'input', 'INPUT 1');
                const input2 = this.createGateOnGrid(startX, startY, 'input', 'INPUT 2');
                const input3 = this.createGateOnGrid(startX, startY + 80, 'input', 'INPUT 3');
                const andGate1 = this.createGateOnGrid(startX + 150, startY - 40, 'and', 'AND1');
                const andGate2 = this.createGateOnGrid(startX + 300, startY, 'and', 'AND2');
                const outputBulb = this.createGateOnGrid(startX + 450, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(input1.getData('gateId'), andGate1.getData('gateId'), 0);
                this.connectGates(input2.getData('gateId'), andGate1.getData('gateId'), 1);
                this.connectGates(andGate1.getData('gateId'), andGate2.getData('gateId'), 0);
                this.connectGates(input3.getData('gateId'), andGate2.getData('gateId'), 1);
                this.connectGates(andGate2.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT B');
                const xorGate = this.createGateOnGrid(startX + 150, startY - 50, 'xor', 'XOR');
                const andGate = this.createGateOnGrid(startX + 150, startY + 50, 'and', 'AND');
                const sumBulb = this.createGateOnGrid(startX + 300, startY - 50, 'bulb', 'SUM');
                const carryBulb = this.createGateOnGrid(startX + 300, startY + 50, 'bulb', 'CARRY');
                
                this.connectGates(inputA.getData('gateId'), xorGate.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), xorGate.getData('gateId'), 1);
                this.connectGates(inputA.getData('gateId'), andGate.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), andGate.getData('gateId'), 1);
                this.connectGates(xorGate.getData('gateId'), sumBulb.getData('gateId'), 0);
                this.connectGates(andGate.getData('gateId'), carryBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 80, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY + 80, 'input', 'INPUT B');
                
                const nand1 = this.createGateOnGrid(startX + 150, startY - 40, 'nand', 'NAND1');
                const nand2 = this.createGateOnGrid(startX + 150, startY + 40, 'nand', 'NAND2');
                const nand3 = this.createGateOnGrid(startX + 300, startY - 40, 'nand', 'NAND3');
                const nand4 = this.createGateOnGrid(startX + 300, startY + 40, 'nand', 'NAND4');
                const nand5 = this.createGateOnGrid(startX + 450, startY, 'nand', 'NAND5');
                const outputBulb = this.createGateOnGrid(startX + 600, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(inputA.getData('gateId'), nand1.getData('gateId'), 0);
                this.connectGates(inputA.getData('gateId'), nand1.getData('gateId'), 1);
                this.connectGates(inputB.getData('gateId'), nand2.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), nand2.getData('gateId'), 1);
                
                this.connectGates(inputA.getData('gateId'), nand3.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), nand3.getData('gateId'), 1);
                
                this.connectGates(nand1.getData('gateId'), nand4.getData('gateId'), 0);
                this.connectGates(nand3.getData('gateId'), nand4.getData('gateId'), 1);
                this.connectGates(nand2.getData('gateId'), nand5.getData('gateId'), 0);
                this.connectGates(nand3.getData('gateId'), nand5.getData('gateId'), 1);
                
                this.connectGates(nand4.getData('gateId'), outputBulb.getData('gateId'), 0);
                this.connectGates(nand5.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputs = [
                    this.createGateOnGrid(startX, startY - 120, 'input', 'INPUT A'),
                    this.createGateOnGrid(startX, startY - 40, 'input', 'INPUT B'),
                    this.createGateOnGrid(startX, startY + 40, 'input', 'INPUT C'),
                    this.createGateOnGrid(startX, startY + 120, 'input', 'INPUT D')
                ];
                
                const and1 = this.createGateOnGrid(startX + 150, startY - 80, 'and', 'AND1');
                const and2 = this.createGateOnGrid(startX + 150, startY - 40, 'and', 'AND2');
                const and3 = this.createGateOnGrid(startX + 150, startY, 'and', 'AND3');
                const and4 = this.createGateOnGrid(startX + 150, startY + 40, 'and', 'AND4');
                const and5 = this.createGateOnGrid(startX + 150, startY + 80, 'and', 'AND5');
                
                const or1 = this.createGateOnGrid(startX + 300, startY - 20, 'or', 'OR1');
                const or2 = this.createGateOnGrid(startX + 300, startY + 20, 'or', 'OR2');
                const or3 = this.createGateOnGrid(startX + 450, startY, 'or', 'OR3');
                const outputBulb = this.createGateOnGrid(startX + 600, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(inputs[0].getData('gateId'), and1.getData('gateId'), 0);
                this.connectGates(inputs[1].getData('gateId'), and1.getData('gateId'), 1);
                this.connectGates(inputs[0].getData('gateId'), and2.getData('gateId'), 0);
                this.connectGates(inputs[2].getData('gateId'), and2.getData('gateId'), 1);
                this.connectGates(inputs[0].getData('gateId'), and3.getData('gateId'), 0);
                this.connectGates(inputs[3].getData('gateId'), and3.getData('gateId'), 1);
                this.connectGates(inputs[1].getData('gateId'), and4.getData('gateId'), 0);
                this.connectGates(inputs[2].getData('gateId'), and4.getData('gateId'), 1);
                
                this.connectGates(and1.getData('gateId'), or1.getData('gateId'), 0);
                this.connectGates(and2.getData('gateId'), or1.getData('gateId'), 1);
                this.connectGates(and3.getData('gateId'), or2.getData('gateId'), 0);
                this.connectGates(and4.getData('gateId'), or2.getData('gateId'), 1);
                this.connectGates(or1.getData('gateId'), or3.getData('gateId'), 0);
                this.connectGates(or2.getData('gateId'), or3.getData('gateId'), 1);
                this.connectGates(or3.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 80, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY, 'input', 'INPUT B');
                const inputCin = this.createGateOnGrid(startX, startY + 80, 'input', 'CARRY IN');
                
                const xor1 = this.createGateOnGrid(startX + 150, startY - 40, 'xor', 'XOR1');
                const and1 = this.createGateOnGrid(startX + 150, startY + 40, 'and', 'AND1');
                const xor2 = this.createGateOnGrid(startX + 300, startY - 40, 'xor', 'XOR2');
                const and2 = this.createGateOnGrid(startX + 300, startY + 40, 'and', 'AND2');
                const orGate = this.createGateOnGrid(startX + 450, startY + 40, 'or', 'OR');
                
                const sumBulb = this.createGateOnGrid(startX + 450, startY - 40, 'bulb', 'SUM');
                const carryBulb = this.createGateOnGrid(startX + 600, startY + 40, 'bulb', 'CARRY OUT');
                
                this.connectGates(inputA.getData('gateId'), xor1.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), xor1.getData('gateId'), 1);
                this.connectGates(inputA.getData('gateId'), and1.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), and1.getData('gateId'), 1);
                
                this.connectGates(xor1.getData('gateId'), xor2.getData('gateId'), 0);
                this.connectGates(inputCin.getData('gateId'), xor2.getData('gateId'), 1);
                this.connectGates(xor1.getData('gateId'), and2.getData('gateId'), 0);
                this.connectGates(inputCin.getData('gateId'), and2.getData('gateId'), 1);
                
                this.connectGates(and1.getData('gateId'), orGate.getData('gateId'), 0);
                this.connectGates(and2.getData('gateId'), orGate.getData('gateId'), 1);
                
                this.connectGates(xor2.getData('gateId'), sumBulb.getData('gateId'), 0);
                this.connectGates(orGate.getData('gateId'), carryBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 50, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY + 50, 'input', 'INPUT B');
                
                const notB = this.createGateOnGrid(startX + 150, startY + 50, 'not', 'NOT B');
                const greaterAnd = this.createGateOnGrid(startX + 300, startY - 50, 'and', 'AND1');
                const greaterBulb = this.createGateOnGrid(startX + 450, startY - 50, 'bulb', 'A > B');
                
                const notA = this.createGateOnGrid(startX + 150, startY - 50, 'not', 'NOT A');
                const lessAnd = this.createGateOnGrid(startX + 300, startY + 50, 'and', 'AND2');
                const lessBulb = this.createGateOnGrid(startX + 450, startY + 50, 'bulb', 'A < B');
                
                const xorGate = this.createGateOnGrid(startX + 150, startY, 'xor', 'XOR');
                const equalNot = this.createGateOnGrid(startX + 300, startY, 'not', 'NOT');
                const equalBulb = this.createGateOnGrid(startX + 450, startY, 'bulb', 'A = B');
                
                this.connectGates(inputA.getData('gateId'), greaterAnd.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), notB.getData('gateId'), 0);
                this.connectGates(notB.getData('gateId'), greaterAnd.getData('gateId'), 1);
                this.connectGates(greaterAnd.getData('gateId'), greaterBulb.getData('gateId'), 0);
                
                this.connectGates(inputA.getData('gateId'), notA.getData('gateId'), 0);
                this.connectGates(notA.getData('gateId'), lessAnd.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), lessAnd.getData('gateId'), 1);
                this.connectGates(lessAnd.getData('gateId'), lessBulb.getData('gateId'), 0);
                
                this.connectGates(inputA.getData('gateId'), xorGate.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), xorGate.getData('gateId'), 1);
                this.connectGates(xorGate.getData('gateId'), equalNot.getData('gateId'), 0);
                this.connectGates(equalNot.getData('gateId'), equalBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 80, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY, 'input', 'INPUT B');
                const select = this.createGateOnGrid(startX, startY + 80, 'input', 'SELECT S');
                
                const notS = this.createGateOnGrid(startX + 150, startY + 80, 'not', 'NOT S');
                const and1 = this.createGateOnGrid(startX + 300, startY - 40, 'and', 'AND1');
                const and2 = this.createGateOnGrid(startX + 300, startY + 40, 'and', 'AND2');
                const orGate = this.createGateOnGrid(startX + 450, startY, 'or', 'OR');
                const outputBulb = this.createGateOnGrid(startX + 600, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(inputA.getData('gateId'), and1.getData('gateId'), 0);
                this.connectGates(select.getData('gateId'), notS.getData('gateId'), 0);
                this.connectGates(notS.getData('gateId'), and1.getData('gateId'), 1);
                
                this.connectGates(inputB.getData('gateId'), and2.getData('gateId'), 0);
                this.connectGates(select.getData('gateId'), and2.getData('gateId'), 1);
                
                this.connectGates(and1.getData('gateId'), orGate.getData('gateId'), 0);
                this.connectGates(and2.getData('gateId'), orGate.getData('gateId'), 1);
                this.connectGates(orGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 80, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY, 'input', 'INPUT B');
                const inputC = this.createGateOnGrid(startX, startY + 80, 'input', 'INPUT C');
                
                const xor1 = this.createGateOnGrid(startX + 150, startY - 40, 'xor', 'XOR1');
                const xor2 = this.createGateOnGrid(startX + 300, startY, 'xor', 'XOR2');
                const outputBulb = this.createGateOnGrid(startX + 450, startY, 'bulb', 'OUTPUT');
                
                this.connectGates(inputA.getData('gateId'), xor1.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), xor1.getData('gateId'), 1);
                this.connectGates(xor1.getData('gateId'), xor2.getData('gateId'), 0);
                this.connectGates(inputC.getData('gateId'), xor2.getData('gateId'), 1);
                this.connectGates(xor2.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const A1 = this.createGateOnGrid(startX, startY - 120, 'input', 'A1');
                const A0 = this.createGateOnGrid(startX, startY - 40, 'input', 'A0');
                const B1 = this.createGateOnGrid(startX, startY + 40, 'input', 'B1');
                const B0 = this.createGateOnGrid(startX, startY + 120, 'input', 'B0');
                
                const xor1 = this.createGateOnGrid(startX + 150, startY - 80, 'xor', 'XOR1');
                const xor2 = this.createGateOnGrid(startX + 150, startY - 40, 'xor', 'XOR2');
                const xor3 = this.createGateOnGrid(startX + 150, startY, 'xor', 'XOR3');
                const xor4 = this.createGateOnGrid(startX + 150, startY + 40, 'xor', 'XOR4');
                
                const and1 = this.createGateOnGrid(startX + 300, startY - 60, 'and', 'AND1');
                const and2 = this.createGateOnGrid(startX + 300, startY + 20, 'and', 'AND2');
                const orGate = this.createGateOnGrid(startX + 450, startY - 20, 'or', 'OR');
                const notGate = this.createGateOnGrid(startX + 600, startY - 20, 'not', 'NOT');
                const outputBulb = this.createGateOnGrid(startX + 750, startY - 20, 'bulb', 'VALID?');

                this.connectGates(A0.getData('gateId'), xor1.getData('gateId'), 0);
                this.connectGates(B0.getData('gateId'), xor1.getData('gateId'), 1);
                this.connectGates(A1.getData('gateId'), xor2.getData('gateId'), 0);
                this.connectGates(B1.getData('gateId'), xor2.getData('gateId'), 1);
                
                this.connectGates(xor1.getData('gateId'), and1.getData('gateId'), 0);
                this.connectGates(xor2.getData('gateId'), and1.getData('gateId'), 1);
                this.connectGates(and1.getData('gateId'), orGate.getData('gateId'), 0);
                this.connectGates(orGate.getData('gateId'), notGate.getData('gateId'), 0);
                this.connectGates(notGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            },
            
            () => {
                const startX = sX, startY = sX;
                this.resetWorkspace();
                
                const inputA = this.createGateOnGrid(startX, startY - 80, 'input', 'INPUT A');
                const inputB = this.createGateOnGrid(startX, startY, 'input', 'INPUT B');
                const inputC = this.createGateOnGrid(startX, startY + 80, 'input', 'INPUT C');
                
                const andGate = this.createGateOnGrid(startX + 150, startY - 40, 'and', 'AND');
                const notC = this.createGateOnGrid(startX + 150, startY + 40, 'not', 'NOT C');
                const orGate = this.createGateOnGrid(startX + 300, startY, 'or', 'OR');
                const outputBulb = this.createGateOnGrid(startX + 450, startY, 'bulb', 'OUTPUT F');
                
                this.connectGates(inputA.getData('gateId'), andGate.getData('gateId'), 0);
                this.connectGates(inputB.getData('gateId'), andGate.getData('gateId'), 1);
                this.connectGates(inputC.getData('gateId'), notC.getData('gateId'), 0);
                this.connectGates(andGate.getData('gateId'), orGate.getData('gateId'), 0);
                this.connectGates(notC.getData('gateId'), orGate.getData('gateId'), 1);
                this.connectGates(orGate.getData('gateId'), outputBulb.getData('gateId'), 0);
            }
        ];

        const getRandomChallengeIndex = () => {
            return Math.floor(Math.random() * this.challenges.length);
        };

        this.currentChallengeIndex = getRandomChallengeIndex();
        this.startTimer();

        const taskBoxWidth = Math.min(450, width - panelWidth - 100);
        const taskBoxHeight = 120;
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
            this.challenges[this.currentChallengeIndex].prompt,
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
            const bg = this.add.graphics().setDepth(1000);

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
                .setDepth(1001)
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
                fontSize: 20,
                color: '#ffffff',
                fontStyle: 'bold',
                letterSpacing: 1,
                align: 'center'
            })
                .setOrigin(0.5)
                .setDepth(1002);

            text.setShadow(1, 1, 'rgba(0, 0, 0, 0.5)', 2, true, false);

            button.text = text;
            button.hitZone = hitZone;
            button.setActive = (isActive) => {
                button.active = !!isActive;
                drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
            };

            return button;
        };

        const checkBtn = makeButton(width - 140, 100, 'Preveri', () => {
            this._suppressCheckTextClear = true;
            this._suppressCheckTextClearUntil = Date.now() + 3000;
            this.time.delayedCall(3000, () => {
                this._suppressCheckTextClear = false;
                this._suppressCheckTextClearUntil = 0;
            });
            this.evaluateChallenge();
        });

        const solveBtn = makeButton(width - 140, 170, 'Rešitev', () => {
            this.createSolution();
        }, { activeColor: 0x00aa00 });

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
        this.timerCountdown = 25;
        this.timerText.setText(`⏱ ${this.formatTime(this.timerCountdown)}`);
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

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    updateTimer() {
        if (!this.timerActive) return;

        this.timerCountdown--;
        this.timerText.setText(`⏱ ${this.formatTime(this.timerCountdown)}`);

        if (this.timerCountdown <= 30) {
            this.timerText.setColor('#ff0000');
            this.timerText.setShadow(0, 0, 'rgba(255, 0, 0, 0.7)', 8, true, false);
        } else if (this.timerCountdown <= 60) {
            this.timerText.setColor('#ff9900');
            this.timerText.setShadow(0, 0, 'rgba(255, 153, 0, 0.5)', 5, true, false);
        } else {
            this.timerText.setColor('#00ff00');
            this.timerText.setShadow(0, 0, 'rgba(0, 255, 0, 0.5)', 5, true, false);
        }

        if (this.timerCountdown <= 0) {
            console.log("FAIL");
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
        } catch (e) { }

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

                        this.updateBulbAppearance(c, val);
                    }
                }
            });
        } catch (e) { }
    }

    updateBulbAppearance(container, isOn) {
        const img = container.getData('img');
        const gateId = container.getData('gateId');

        if (!img) return;

        img.setTexture(isOn ? 'BULB' : 'BULB');

        if (isOn) {
            if (!this.bulbGlows.has(gateId)) {
                const glow = this.add.circle(0, 0, 50, 0xffff00, 0.3)
                    .setDepth(-1);

                container.add(glow);

                this.tweens.add({
                    targets: glow,
                    scale: { from: 0.8, to: 1.2 },
                    alpha: { from: 0.2, to: 0.4 },
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                this.bulbGlows.set(gateId, glow);
            }
        } else {
            if (this.bulbGlows.has(gateId)) {
                const glow = this.bulbGlows.get(gateId);
                if (glow) {
                    this.tweens.killTweensOf(glow);
                    const index = container.list.indexOf(glow);
                    if (index !== -1) {
                        container.list.splice(index, 1);
                    }
                    glow.destroy();
                }
                this.bulbGlows.delete(gateId);
            }
        }
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
        } catch (e) { }
    }

    hidePinTooltip() {
        if (this.pinTooltip) {
            try {
                if (this.pinTooltip.bg && this.pinTooltip.bg.destroy) this.pinTooltip.bg.destroy();
                if (this.pinTooltip.text && this.pinTooltip.text.destroy) this.pinTooltip.text.destroy();
            } catch (e) { }
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

            try { gfx.destroy(); } catch (e) { }
            try { glow.destroy(); } catch (e) { }
            try { hit.destroy(); } catch (e) { }

            this.connections = this.connections.filter(c => !(c.fromId === fromId && c.toId === toId && c.toPinIndex === toPinIndex));

            this.checkText.setText('Povezava odstranjena');
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

        const glow = this.add.circle(0, 0, size / 2 + 5, color, 0.7);
        container.add(glow);

        const img = this.add.image(0, 0, textureName)
            .setDisplaySize(size, size)
            .setOrigin(0.5)
            .setAlpha(1);
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
        container.setData('glow', glow);
        container.setData('originalGlowAlpha', 1);

        this.input.setDraggable(container);

        container.on('pointerover', () => {
            if (container.getData('isInPanel')) {
                container.setScale(1.1);
                glow.setAlpha(0.6);
            }
        });

        container.on('pointerout', () => {
            if (container.getData('isInPanel')) {
                container.setScale(1);
                glow.setAlpha(container.getData('originalGlowAlpha'));
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

        return container;
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

        if (this.bulbGlows.has(gateId)) {
            const glow = this.bulbGlows.get(gateId);
            if (glow) {
                this.tweens.killTweensOf(glow);
                glow.destroy();
            }
            this.bulbGlows.delete(gateId);
        }

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
                try { this.inputIndices.delete(idx); } catch (e) { }
            }
            if (t === 'bulb' && typeof idx === 'number') {
                try { this.bulbIndices.delete(idx); } catch (e) { }
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

            this.updateBulbAppearance(container, false);
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

    evaluateChallenge() {
        const currentChallenge = this.challenges[this.currentChallengeIndex];

        if (!currentChallenge) {
            this.showStatus('Ni aktivne naloge!', '#ff0000', 2000);
            return;
        }

        try {
            if (this.logicCircuit && typeof this.logicCircuit.evaluate === 'function') {
                this.logicCircuit.evaluate();
            }
        } catch (e) { }

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
                        this.updateBulbAppearance(c, val);
                    }
                }
            });
        } catch (e) { }

        const isValid = currentChallenge.solutionCheck(this.logicCircuit);

        const statusText = bulbEntries.length > 0 ? `${bulbEntries.join(' | ')}` : 'Ni OUTPUT vrat';

        if (isValid) {
            this.stopTimer();

            this.cameras.main.shake(200, 0.01);
            console.log("SUCCESS");
            this.showStatus(`${statusText} — Naloga opravljena!`, '#00ff00', 2500);

            this.time.delayedCall(1500, () => this.nextChallenge());
        } else {
            console.log("FAIL");
            this.showStatus(`${statusText} — Naloga ni pravilno rešena!`, '#cc0000', 2000);
        }
    }

    nextChallenge() {
        this.resetWorkspace();
        this.currentChallengeIndex = Math.floor(Math.random() * this.challenges.length);
        this.taskText.setText(this.challenges[this.currentChallengeIndex].prompt);
        this.startTimer();
        this.showStatus('Nova naloga!', '#00ffcc', 2000);
    }

    getInputGates(circuit) {
        const inputs = [];
        for (const [id, gate] of circuit.gates) {
            if (gate.operation === 'BUFFER') {
                inputs.push(gate);
            }
        }
        return inputs;
    }

    getOutputGates(circuit) {
        const outputs = [];
        for (const [id, gate] of circuit.gates) {
            if (gate.operation === 'LIGHT') {
                outputs.push(gate);
            }
        }
        return outputs;
    }

    resetWorkspace() {
        this.bulbGlows.forEach((glow, gateId) => {
            if (glow) {
                this.tweens.killTweensOf(glow);
                glow.destroy();
            }
        });
        this.bulbGlows.clear();

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
        try { this.inputIndices = new Set(); } catch (e) { }
        try { this.bulbIndices = new Set(); } catch (e) { }
        this._origCheckTextSet('Workspace reset');
        this.time.delayedCall(1500, () => this._origCheckTextSet(''));
    }

    deleteGate(container, gateId) {
        try {
            if (this.bulbGlows.has(gateId)) {
                const glow = this.bulbGlows.get(gateId);
                if (glow) {
                    this.tweens.killTweensOf(glow);
                    glow.destroy();
                }
                this.bulbGlows.delete(gateId);
            }

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

    createGateOnGrid(x, y, type, labelText) {
        const snapped = this.snapToGrid(x, y);
        const container = this.add.container(snapped.x, snapped.y);
        container.setDepth(20);

        const size = 72;
        const textureName = this.getTextureName(type);

        const img = this.add.image(0, 0, textureName)
            .setDisplaySize(size, size)
            .setOrigin(0.5)
            .setAlpha(1);
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

        const id = `${type}_${this.getRandomInt(1000, 9999)}`;
        const gateType = this.getGateType(type);
        const gate = this.logicCircuit.addGate(gateType, id);
        
        container.setData('logicGate', gate);
        container.setData('gateId', id);
        container.setData('labelTextObj', label);
        container.setData('type', type);
        container.setData('isInPanel', false);
        container.setData('displayName', labelText || type);

        if (type === 'input') {
            container.setData('inputValue', true);
            let idx = 1;
            while (this.inputIndices.has(idx)) idx++;
            this.inputIndices.add(idx);
            container.setData('displayIndex', idx);
            label.setText(`${labelText} = ON`);
            label.setColor('#00ff00');
        }

        if (type === 'bulb') {
            container.setData('isBulb', true);
            let bidx = 1;
            while (this.bulbIndices.has(bidx)) bidx++;
            this.bulbIndices.add(bidx);
            container.setData('displayIndex', bidx);
            this.updateBulbAppearance(container, false);
        }

        this.setupInputOutputPins(container, type, labelText, img);
        this.placedComponents.push(container);

        return container;
    }

    connectGates(fromGateId, toGateId, toPinIndex) {
        try {
            const ok = this.logicCircuit.connectGatesWithIndex(fromGateId, toGateId, toPinIndex);
            if (ok) {
                const fromContainer = this.placedComponents.find(c => c.getData('gateId') === fromGateId);
                const toContainer = this.placedComponents.find(c => c.getData('gateId') === toGateId);
                
                if (fromContainer && toContainer) {
                    const fromPin = fromContainer.getData('outputPin');
                    const toPins = toContainer.getData('inputPins') || [];
                    const toPin = toPins[toPinIndex];
                    
                    if (fromPin && toPin) {
                        const fromX = fromContainer.x + fromPin.x;
                        const fromY = fromContainer.y + fromPin.y;
                        const toX = toContainer.x + toPin.x;
                        const toY = toContainer.y + toPin.y;
                        
                        this.drawConnectionWithBend(fromX, fromY, toX, toY, fromGateId, toGateId, toPinIndex);
                        return true;
                    }
                }
            }
        } catch (e) { }
        return false;
    }

    createSolution() {
        if (this.currentChallengeIndex >= 0 && this.currentChallengeIndex < this.challengeSolutions.length) {
            try {
                this.showStatus('Ustvarjam rešitev...', '#00ffcc', 2000);
                this.challengeSolutions[this.currentChallengeIndex]();
            } catch (error) {
                this.showStatus('Napaka pri ustvarjanju rešitve', '#ff0000', 2000);
            }
        } else {
            this.showStatus('Rešitev za to nalogo ni na voljo', '#ff9900', 2000);
        }
    }
}
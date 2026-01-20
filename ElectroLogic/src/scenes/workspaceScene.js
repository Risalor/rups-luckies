import Phaser from "phaser";
import LabScene from "./labScene";
import { Battery } from "../components/battery";
import { Bulb } from "../components/bulb";
import { Wire } from "../components/wire";
import { CircuitGraph } from "../logic/circuit_graph";
import { Node } from "../logic/node";
import { Switch } from "../components/switch";
import { Resistor } from "../components/resistor";

export default class WorkspaceScene extends Phaser.Scene {
  constructor() {
    super("WorkspaceScene");
  }

  init() {
    this.currentChallengeIndex = 0;
  }

  getRandomChallengeIndex() {
    if (this.challenges && this.challenges.length > 0) {
      return Math.floor(Math.random() * this.challenges.length);
    }
    return 0;
  }

  preload() {
    this.graph = new CircuitGraph();
    this.load.image("baterija", "src/components/svgs/battery.svg");
    this.load.image("upor", "src/components/svgs/resistor.svg");
    this.load.image("svetilka", "src/components/svgs/bulb.svg");
    this.load.image("stikalo-on", "src/components/svgs/switch-on.svg");
    this.load.image("stikalo-off", "src/components/svgs/switch-off.svg");
    this.load.image("žica", "src/components/svgs/line.svg");
    // this.load.image('ampermeter', 'src/components/ammeter.png');
    // this.load.image('voltmeter', 'src/components/voltmeter.png');
    this.load.image("trash", "src/components/svgs/trash.svg");
    this.load.image("svetilka-on", "src/components/svgs/bulb-on.svg");
  }

  create() {
    this.input.mouse.disableContextMenu();

    const { width, height } = this.cameras.main;

    // površje mize
    const desk = this.add.rectangle(0, 0, width, height, 0xe0c9a6).setOrigin(0);
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x8b7355, 0.35);
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, height);
      gridGraphics.strokePath();
    }
    for (let y = 0; y < height; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(width, y);
      gridGraphics.strokePath();
    }

    this.infoWindow = this.add.container(0, 0);
    this.infoWindow.setDepth(1000);
    this.infoWindow.setVisible(false);

    // dot textura za animacjo toka
    const flowGfx = this.add.graphics();
    flowGfx.fillStyle(0xffff66, 1);
    flowGfx.fillCircle(4, 4, 4);
    flowGfx.generateTexture("flow-dot", 8, 8);
    flowGfx.destroy();

    this.currentFlows = [];

    // ozadje info okna
    const infoBox = this.add.rectangle(0, 0, 200, 80, 0x2c2c2c, 0.95);
    infoBox.setStrokeStyle(2, 0xffffff);
    const infoText = this.add
      .text(0, 0, "", {
        fontSize: "14px",
        color: "#ffffff",
        align: "left",
        wordWrap: { width: 180 },
      })
      .setOrigin(0.5);

    this.infoWindow.add([infoBox, infoText]);
    this.infoText = infoText;

    this.trash = this.add
      .image(
        this.cameras.main.width - 80,
        this.cameras.main.height - 80,
        "trash",
      )
      .setOrigin(0.5)
      .setDisplaySize(90, 90)
      .setDepth(2000)
      .setAlpha(0.5);

    this.trashGlow = false;

    this.scale.on("resize", (size) => {
      this.trash.x = size.width - 80;
      this.trash.y = size.height - 80;
    });

    this.challenges = [
      {
        prompt:
          "Connect a battery and a bulb in a closed loop to make it light up.",
        requiredComponents: ["baterija", "svetilka"],
        theory:
          "Electric current only flows in a closed circuit from the positive to the negative terminal of the battery.",
      },
      {
        prompt:
          "Connect a bulb in series with a resistor to limit the current.",
        requiredComponents: ["baterija", "svetilka", "upor"],
        theory:
          "In a series connection, a resistor reduces the total current flowing through the circuit.",
      },
      {
        prompt:
          "The bulb must be connected in series with two switches (both must be closed).",
        requiredComponents: [
          "baterija",
          "svetilka",
          "stikalo-on",
          "stikalo-on",
        ],
        theory:
          "In a series switch arrangement, the entire path must be closed for current to flow. This represents a Logical AND.",
      },
      {
        prompt:
          " Connect two bulbs in series. In real life they would shine dimmer than a single bulb.",
        requiredComponents: ["baterija", "svetilka", "svetilka"],
        theory:
          "In a series circuit, the battery's voltage is split between the bulbs, reducing their brightness.",
      },
      {
        prompt:
          "Connect two bulbs in parallel to the battery so both shine at full brightness.",
        requiredComponents: ["baterija", "svetilka", "svetilka"],
        theory:
          "In a parallel circuit, each component receives the full voltage of the source.",
      },
      {
        prompt:
          "The bulb should light up if either of the two parallel switches is closed.",
        requiredComponents: [
          "baterija",
          "svetilka",
          "stikalo-on",
          "stikalo-on",
        ],
        theory:
          "Parallel switches provide multiple paths for electricity. This represents a Logical OR.",
      },
      {
        prompt:
          "Create a series chain of two resistors. Connect a bulb in parallel to the second resistor only.",
        requiredComponents: ["baterija", "upor", "upor", "svetilka"],
        theory:
          "This is a classic voltage divider. The bulb only receives a fraction of the total battery voltage, determined by the ratio of the two resistors.",
      },

      {
        prompt:
          "8. Connect a bulb so it is controlled by a 'Master Switch' in series, but has two 'Operational Switches' in parallel with each other.",
        requiredComponents: [
          "baterija",
          "svetilka",
          "stikalo-on",
          "stikalo-on",
          "stikalo-on",
        ],
        theory:
          "This simulates a real-world safety system. The Master switch can kill the power, but either operational switch can activate the load (Master AND (Op1 OR Op2)).",
      },

      {
        prompt:
          "Create two parallel branches. Each branch must contain one resistor and one bulb in series.",
        requiredComponents: [
          "baterija",
          "upor",
          "upor",
          "svetilka",
          "svetilka",
        ],
        theory:
          "In this configuration, each branch is independent. The total current from the battery is the sum of the currents through both branches.",
      },

      {
        prompt:
          " Place one resistor immediately after the battery, then connect two bulbs in parallel with each other after that resistor.",
        requiredComponents: ["baterija", "upor", "svetilka", "svetilka"],
        theory:
          "The single resistor acts as a current limiter for the entire parallel network. If one bulb is removed, the voltage across the remaining bulb will actually increase.",
      },

      {
        prompt:
          " Connect a resistor in series with the battery. Then, connect a bulb and a switch such that closing the switch turns the bulb OFF.",
        requiredComponents: ["baterija", "upor", "svetilka", "stikalo-on"],
        theory:
          "By placing the switch in parallel with the bulb (and using a series resistor to prevent a dead short), the switch 'steals' the current, simulating a NOT gate logic.",
      },

      {
        prompt:
          "Connect two resistors in parallel. Then, connect this parallel pair in series with a single bulb.",
        requiredComponents: ["baterija", "upor", "upor", "svetilka"],
        theory:
          "Two parallel resistors have a lower total resistance than one. This 'equivalent resistance' determines the brightness of the series bulb.",
      },

      {
        prompt:
          " Construct a circuit where two bulbs are in parallel, and each bulb has its own dedicated switch in series within its branch.",
        requiredComponents: [
          "baterija",
          "svetilka",
          "svetilka",
          "stikalo-on",
          "stikalo-on",
        ],
        theory:
          "This is the fundamental design of home wiring. Each load (bulb) can be operated without affecting the state of the other.",
      },

      {
        prompt:
          " Connect three bulbs in parallel, but place a switch in the 'Main Branch' so it controls all three simultaneously.",
        requiredComponents: [
          "baterija",
          "stikalo-on",
          "svetilka",
          "svetilka",
          "svetilka",
        ],
        theory:
          "This demonstrates a main circuit breaker or master power switch. Despite the complexity of the parallel loads, the master switch interrupts the total current $I_{total}$.",
      },
    ];

    this.currentChallengeIndex = this.getRandomChallengeIndex();

    // this.currentChallengeIndex = 0;

    this.currentChallengeIndex = this.getRandomChallengeIndex();
    this.promptText = this.add
      .text(
        width / 1.8,
        height - 30,
        this.challenges[this.currentChallengeIndex].prompt,
        {
          fontSize: "20px",
          color: "#333",
          fontStyle: "bold",
          backgroundColor: "#ffffff88",
          padding: { x: 15, y: 8 },
          wordWrap: { width: 700 },
        },
      )
      .setOrigin(0.5);

    this.checkText = this.add
      .text(width / 2, height - 70, "", {
        fontSize: "18px",
        color: "#000000",
        fontStyle: "bold",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5);

    this.nextRandomChallenge = () => {
      this.currentChallengeIndex = this.getRandomChallengeIndex();
      this.promptText.setText(
        this.challenges[this.currentChallengeIndex].prompt,
      );
    };

    const buttonWidth = 180;
    const buttonHeight = 45;
    const cornerRadius = 10;

    const makeButton = (x, y, label, onClick) => {
      const bg = this.add.graphics();
      bg.fillStyle(0x3399ff, 1);
      bg.fillRoundedRect(
        x - buttonWidth / 2,
        y - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius,
      );

      const text = this.add
        .text(x, y, label, {
          fontFamily: "Arial",
          fontSize: "20px",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => {
          bg.clear();
          bg.fillStyle(0x0f5cad, 1);
          bg.fillRoundedRect(
            x - buttonWidth / 2,
            y - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            cornerRadius,
          );
        })
        .on("pointerout", () => {
          bg.clear();
          bg.fillStyle(0x3399ff, 1);
          bg.fillRoundedRect(
            x - buttonWidth / 2,
            y - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            cornerRadius,
          );
        })
        .on("pointerdown", onClick);

      return { bg, text };
    };

    /* makeButton(width - 140, 75, "Lestvica", () =>
      this.scene.start("ScoreboardScene", { cameFromMenu: false }),
    );*/
    makeButton(width - 140, 125, "Check Circuit", () => this.checkCircuit());
    makeButton(width - 140, 175, "Simulation", () => {
      this.connected = this.graph.simulate();

      this.sim = this.connected === 1;

      if (this.connected === 1) {
        this.checkText.setStyle({ color: "#00aa00" });
        this.checkText.setText("Električni tok je sklenjen");
      } else if (this.connected === -1) {
        this.checkText.setStyle({ color: "#cc0000" });
        this.checkText.setText("Manjka ti baterija");
      } else if (this.connected === -2) {
        this.checkText.setStyle({ color: "#cc0000" });
        this.checkText.setText("Stikalo je izklopljeno");
      } else {
        this.checkText.setStyle({ color: "#cc0000" });
        this.checkText.setText("Električni tok ni sklenjen");
      }

      // updata barvo bulba
      this.placedComponents.forEach((c) => {
        const logic = c.getData("logicComponent");
        if (!logic) return;
        if (logic.type === "bulb") {
          try {
            c.list[0].setTexture(this.sim ? "svetilka-on" : "svetilka");
          } catch (e) {
            //console.warn("Failed to update bulb texture", e);
          }
        }
      });
    });

    // stranska vrstica na levi
    const panelWidth = 150;
    this.add.rectangle(0, 0, panelWidth, height, 0xc0c0c0).setOrigin(0);
    this.add.rectangle(0, 0, panelWidth, height, 0x000000, 0.2).setOrigin(0);

    this.add
      .text(panelWidth / 2, 60, "Components", {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // komponente v stranski vrstici
    this.createComponent(panelWidth / 2, 120, "baterija", 0xffcc00);
    this.createComponent(panelWidth / 2, 220, "svetilka", 0xff0000);
    this.createComponent(panelWidth / 2, 320, "žica", 0x0066cc);
    this.createComponent(panelWidth / 2, 420, "stikalo-on", 0x666666);
    this.createComponent(panelWidth / 2, 520, "upor", 0xff6600);
    //this.createComponent(panelWidth / 2, 420, 'stikalo-off', 0x666666);
    // this.createComponent(panelWidth / 2, 580, 'ampermeter', 0x00cc66);
    // this.createComponent(panelWidth / 2, 660, 'voltmeter', 0x00cc66);

    const backButton = this.add
      .text(12, 10, "↩ Back", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#387affff",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => backButton.setStyle({ color: "#0054fdff" }))
      .on("pointerout", () => backButton.setStyle({ color: "#387affff" }))
      .on("pointerdown", () => {
        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start("LabScene");
        });
      });

    this.add
      .text(
        width / 2 + 50,
        60,
        "Drag components on the table and build your own electric circuit",
        {
          fontSize: "20px",
          color: "#333",
          fontStyle: "bold",
          align: "center",
          backgroundColor: "#ffffff88",
          padding: { x: 15, y: 8 },
        },
      )
      .setOrigin(0.5);

    // shrani komponente na mizi
    this.placedComponents = [];
    this.gridSize = 40;

    this.timeLimit = 3 * 60; //change adjust time
    this.timeRemaining = this.timeLimit;

    this.timerText = this.add
      .text(this.cameras.main.width / 2, 20, "Time: 00:00", {
        fontSize: "24px",
        fill: "#ff0000",
        fontStyle: "bold",
        backgroundColor: "#ffffffaa",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(2000);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  updateTimer() {
    this.timeRemaining--;

    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeString = `Time: ${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    this.timerText.setText(timeString);

    if (this.timeRemaining <= 0) {
      this.timerEvent.remove();
      this.handleTimeUp();
    }
  }

  handleTimeUp() {
    this.checkText.setText("Čas se je iztekel!");
    this.checkText.setStyle({ color: "#ff0000" });

    console.log("FAILED TASK ", this.currentChallengeIndex);
  }

  getComponentDetails(type) {
    const details = {
      baterija: "Napetost: 3.3 V\nVir električne energije",
      upor: "Uporabnost: omejuje tok\nMeri se v ohmih (Ω)",
      svetilka: "Pretvarja električno energijo v svetlobo",
      "stikalo-on": "Nadzoruje pretok toka\nKlikni za ugašanje/užiganje",
      "stikalo-off": "Prepreči pretok toka",
      žica: "Povezuje komponente",
      //'ampermeter': 'Meri električni tok\nEnota: amperi (A)',
      //'voltmeter': 'Meri električno napetost\nEnota: volti (V)'
    };
    return details[type] || "Komponenta";
  }

  createGrid() {
    const { width, height } = this.cameras.main;
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(2, 0x8b7355, 0.4);

    const gridSize = 40;
    const startX = 200;

    // vertikalne črte
    for (let x = startX; x < width; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, height);
      gridGraphics.strokePath();
    }

    // horizontalne črte
    for (let y = 0; y < height; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(startX, y);
      gridGraphics.lineTo(width, y);
      gridGraphics.strokePath();
    }
  }

  snapToGrid(x, y) {
    const gridSize = this.gridSize;
    const startX = 200;

    // komponeta se postavi na presečišče
    const snappedX = Math.round((x - startX) / gridSize) * gridSize + startX;
    const snappedY = Math.round(y / gridSize) * gridSize;

    return { x: snappedX, y: snappedY };
  }

  getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }

  updateLogicNodePositions(component) {
    const comp = component.getData("logicComponent");
    if (!comp) return;

    const halfW = 40;
    const halfH = 40;

    const localStart = comp.localStart || { x: -halfW, y: 0 };
    const localEnd = comp.localEnd || { x: halfW, y: 0 };

    const theta =
      typeof component.rotation === "number" && component.rotation
        ? component.rotation
        : Phaser.Math.DegToRad(component.angle || 0);

    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const rotate = (p) => ({
      x: Math.round(p.x * cos - p.y * sin),
      y: Math.round(p.x * sin + p.y * cos),
    });

    const rStart = rotate(localStart);
    const rEnd = rotate(localEnd);

    const worldStart = { x: component.x + rStart.x, y: component.y + rStart.y };
    const worldEnd = { x: component.x + rEnd.x, y: component.y + rEnd.y };

    const snappedStart = this.snapToGrid(worldStart.x, worldStart.y);
    const snappedEnd = this.snapToGrid(worldEnd.x, worldEnd.y);

    if (comp.start) {
      comp.start.x = snappedStart.x;
      comp.start.y = snappedStart.y;
      if (!comp.start.connected) comp.start.connected = new Set();

      // assign the canonical node object returned by the graph
      comp.start = this.graph.addNode(comp.start);
      component.setData("logicComponent", comp);
    }
    if (comp.end) {
      comp.end.x = snappedEnd.x;
      comp.end.y = snappedEnd.y;
      if (!comp.end.connected) comp.end.connected = new Set();

      // assign the canonical node object returned by the graph
      comp.end = this.graph.addNode(comp.end);
      component.setData("logicComponent", comp);
    }

    // debug dots are top-level objects (not children). update their positions
    const startDot = component.getData("startDot");
    const endDot = component.getData("endDot");
    if (startDot && comp.start) {
      startDot.x = comp.start.x;
      startDot.y = comp.start.y;
    }
    if (endDot && comp.end) {
      endDot.x = comp.end.x;
      endDot.y = comp.end.y;
    }
  }

  cleanupFlows() {
    if (!this.currentFlows) return;
    for (const item of this.currentFlows) {
      try {
        if (item.follower && item.follower.stopFollow)
          item.follower.stopFollow();
        if (item.follower && item.follower.destroy) item.follower.destroy();
        if (item.sprite && item.sprite.destroy) item.sprite.destroy();
      } catch (e) {}
    }
    this.currentFlows = [];
  }

  startFlows(paths = []) {
    this.cleanupFlows();
    if (!paths || paths.length === 0) return;

    const baseSpeedPxPerSec = 160;
    const minDots = 2;
    const maxDots = 20;

    for (const pathNodes of paths) {
      if (!pathNodes || pathNodes.length < 2) continue;

      const detailedPoints = [];
      for (let i = 0; i < pathNodes.length; i++) {
        const current = { x: pathNodes[i].x, y: pathNodes[i].y };
        detailedPoints.push(current);

        if (i < pathNodes.length - 1) {
          const next = { x: pathNodes[i + 1].x, y: pathNodes[i + 1].y };
          const dx = next.x - current.x;
          const dy = next.y - current.y;
          const dist = Math.hypot(dx, dy);

          const segmentCount = Math.ceil(dist / 20);
          for (let j = 1; j < segmentCount; j++) {
            const t = j / segmentCount;
            detailedPoints.push({
              x: Math.round(current.x + dx * t),
              y: Math.round(current.y + dy * t),
            });
          }
        }
      }

      let totalDist = 0;
      for (let i = 0; i < detailedPoints.length - 1; i++) {
        const dx = detailedPoints[i + 1].x - detailedPoints[i].x;
        const dy = detailedPoints[i + 1].y - detailedPoints[i].y;
        totalDist += Math.hypot(dx, dy);
      }
      if (totalDist === 0) continue;

      const count = Math.min(
        maxDots,
        Math.max(minDots, Math.ceil(totalDist / 120)),
      );

      const curve = new Phaser.Curves.Path(
        detailedPoints[0].x,
        detailedPoints[0].y,
      );
      for (let i = 1; i < detailedPoints.length; i++) {
        curve.lineTo(detailedPoints[i].x, detailedPoints[i].y);
      }

      const duration = Math.max(200, (totalDist / baseSpeedPxPerSec) * 1000);

      for (let i = 0; i < count; i++) {
        const sprite = this.add.follower(
          curve,
          detailedPoints[0].x,
          detailedPoints[0].y,
          "flow-dot",
        );
        sprite.setDepth(1500);
        const delay = Math.round((i / count) * duration);

        sprite.startFollow({
          duration,
          repeat: -1,
          yoyo: false,
          rotateToPath: false,
          delay,
        });

        this.currentFlows.push({ follower: sprite, sprite });
      }
    }
  }

  updateBulbsAndFlows() {
    const simResult = this.graph.simulate();
    this.sim = simResult === 1;

    this.placedComponents.forEach((c) => {
      const logic = c.getData("logicComponent");
      if (!logic) return;
      if (logic.type === "bulb") {
        const img = c.list && c.list[0];
        if (img && img.setTexture) {
          try {
            img.setTexture(this.sim ? "svetilka-on" : "svetilka");
          } catch (e) {}
        }
      }
    });

    const battery = this.graph.components.find((cc) => cc.type === "battery");
    if (this.sim && battery) {
      const paths = this.graph.getConductivePaths(
        battery.start,
        battery.end,
        4,
      );
      this.startFlows(paths);
    } else {
      this.cleanupFlows();
    }

    return simResult;
  }

  createComponent(x, y, type, color) {
    const component = this.add.container(x, y);

    let comp = null;
    let componentImage;
    let id;

    switch (type) {
      case "baterija":
        id = "bat_" + this.getRandomInt(1000, 9999);
        comp = new Battery(
          id,
          new Node(id + "_start", -40, 0),
          new Node(id + "_end", 40, 0),
          3.3,
        );
        comp.type = "battery";
        comp.localStart = { x: -40, y: 0 };
        comp.localEnd = { x: 40, y: 0 };
        componentImage = this.add
          .image(0, 0, "baterija")
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData("logicComponent", comp);

        break;
      case "svetilka":
        id = "bulb_" + this.getRandomInt(1000, 9999);
        comp = new Bulb(
          id,
          new Node(id + "_start", -40, 0),
          new Node(id + "_end", 40, 0),
        );
        comp.type = "bulb";
        comp.localStart = { x: -40, y: 0 };
        comp.localEnd = { x: 40, y: 0 };
        componentImage = this.add
          .image(0, 0, "svetilka")
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData("logicComponent", comp);
        break;

      case "stikalo-on":
        id = "switch_" + this.getRandomInt(1000, 9999);
        comp = new Switch(
          id,
          new Node(id + "_start", -40, 0),
          new Node(id + "_end", 40, 0),
          true,
        );
        comp.type = "switch";
        comp.localStart = { x: -40, y: 0 };
        comp.localEnd = { x: 40, y: 0 };
        componentImage = this.add
          .image(0, 0, "stikalo-on")
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData("logicComponent", comp);
        break;

      case "stikalo-off":
        id = "switch_" + this.getRandomInt(1000, 9999);
        comp = new Switch(
          id,
          new Node(id + "_start", -40, 0),
          new Node(id + "_end", 40, 0),
          false,
        );
        comp.type = "switch";
        comp.localStart = { x: -40, y: 0 };
        comp.localEnd = { x: 40, y: 0 };
        componentImage = this.add
          .image(0, 0, "stikalo-off")
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData("logicComponent", comp);
        break;

      case "žica":
        id = "wire_" + this.getRandomInt(1000, 9999);
        comp = new Wire(
          id,
          new Node(id + "_start", -40, 0),
          new Node(id + "_end", 40, 0),
        );
        comp.type = "wire";
        comp.localStart = { x: -40, y: 0 };
        comp.localEnd = { x: 40, y: 0 };
        componentImage = this.add
          .image(0, 0, "žica")
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData("logicComponent", comp);
        break;
      /*case 'ampermeter':
        id = "ammeter_" + this.getRandomInt(1000, 9999);
        componentImage = this.add.image(0, 0, 'ampermeter')
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData('logicComponent', null)
        break;
      case 'voltmeter':
        id = "voltmeter_" + this.getRandomInt(1000, 9999);
        componentImage = this.add.image(0, 0, 'voltmeter')
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData('logicComponent', null)
        break;
        */
      case "upor":
        id = "res_" + this.getRandomInt(1000, 9999);
        comp = new Resistor(
          id,
          new Node(id + "_start", -40, 0),
          new Node(id + "_end", 40, 0),
          1.5,
        );
        comp.type = "resistor";
        comp.localStart = { x: -40, y: 0 };
        comp.localEnd = { x: 40, y: 0 };
        componentImage = this.add
          .image(0, 0, "upor")
          .setOrigin(0.5)
          .setDisplaySize(80, 80);
        component.add(componentImage);
        component.setData("logicComponent", comp);
        break;
    }

    /*component.on("pointerover", () => {
      if (component.getData("isInPanel")) {
        // prikaži info okno
        const details = this.getComponentDetails(type);
        this.infoText.setText(details);

        // zraven komponente
        this.infoWindow.x = x + 120;
        this.infoWindow.y = y;
        this.infoWindow.setVisible(true);
      }
      component.setScale(1.1);
    });*/

    component.on("pointerout", () => {
      if (component.getData("isInPanel")) {
        this.infoWindow.setVisible(false);
      }
      component.setScale(1);
    });

    // Label
    const displayNames = {
      baterija: "battery",
      svetilka: "bulb",
      "stikalo-on": "switch",
      "stikalo-off": "switch",
      žica: "wire",
      upor: "resistor",
    };

    const label = this.add
      .text(0, 40, displayNames[type] || type, {
        fontSize: "11px",
        color: "#fff",
        backgroundColor: "#00000088",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5);
    component.add(label);

    component.setSize(70, 70);
    component.setInteractive({ draggable: true, useHandCursor: true });

    // shrani originalno pozicijo in tip
    component.setData("originalX", x);
    component.setData("originalY", y);
    component.setData("type", type);
    component.setData("color", color);
    component.setData("isInPanel", true);
    component.setData("rotation", 0);
    if (comp) component.setData("logicComponent", comp);
    component.setData("isDragging", false);

    this.input.setDraggable(component);

    component.on("dragstart", () => {
      component.setData("isDragging", true);
    });

    component.on("drag", (pointer, dragX, dragY) => {
      component.x = dragX;
      component.y = dragY;

      const dist = Phaser.Math.Distance.Between(
        component.x,
        component.y,
        this.trash.x,
        this.trash.y,
      );
      if (dist < 70) {
        this.trash.setAlpha(1);
        this.trashGlow = true;
      } else {
        if (this.trashGlow) {
          this.trashGlow = false;
          this.trash.setAlpha(0.5);
        }
      }
    });

    component.on("dragend", () => {
      const isInPanel = component.x < 200;

      const dist = Phaser.Math.Distance.Between(
        component.x,
        component.y,
        this.trash.x,
        this.trash.y,
      );
      if (dist < 70 && !component.getData("isInPanel")) {
        const comp = component.getData("logicComponent");
        if (comp && typeof this.graph.removeComponent === "function") {
          this.graph.removeComponent(comp);
        }
        this.placedComponents = this.placedComponents.filter(
          (c) => c !== component,
        );

        component.disableInteractive();
        component.setVisible(false);
        this.trash.setAlpha(0.5);

        this.time.delayedCall(30, () => {
          if (component && component.destroy) component.destroy();
        });

        this.updateBulbsAndFlows();

        return;
      }
      if (isInPanel && !component.getData("isInPanel")) {
        // če je ob strani, se odstrani
        component.destroy();
      } else if (!isInPanel && component.getData("isInPanel")) {
        // s strani na mizo
        const snapped = this.snapToGrid(component.x, component.y);
        component.x = snapped.x;
        component.y = snapped.y;

        const comp = component.getData("logicComponent");
        if (comp) {
          //console.log("Component: " + comp);
          this.graph.addComponent(comp);

          // Add start/end nodes to graph if they exist
          if (comp.start) this.graph.addNode(comp.start);
          if (comp.end) this.graph.addNode(comp.end);
        }

        this.updateLogicNodePositions(component);

        component.setData("isRotated", false);
        component.setData("isInPanel", false);

        // odstrani ime ce je na gridu
        if (component.list && component.list[1]) {
          component.list[1].setVisible(false);
        }
        this.createComponent(
          component.getData("originalX"),
          component.getData("originalY"),
          component.getData("type"),
          component.getData("color"),
        );

        this.placedComponents.push(component);
        this.updateBulbsAndFlows();
      } else if (!component.getData("isInPanel")) {
        // na mizi in se postavi na mrežo
        const snapped = this.snapToGrid(component.x, component.y);
        component.x = snapped.x;
        component.y = snapped.y;

        this.updateLogicNodePositions(component);
        this.updateBulbsAndFlows();
      } else {
        // postavi se nazaj na originalno mesto
        component.x = component.getData("originalX");
        component.y = component.getData("originalY");

        this.updateLogicNodePositions(component);
      }

      this.time.delayedCall(500, () => {
        component.setData("isDragging", false);
      });
    });

    component.on("pointerdown", (pointer) => {
      const type = component.getData("type");
      const logic = component.getData("logicComponent");
      const isInPanel = component.getData("isInPanel");

      // levi klik na switch je toggle
      if (
        pointer.leftButtonDown() &&
        (type === "stikalo-on" || type === "stikalo-off") &&
        !isInPanel
      ) {
        //console.log("LEFT CLICK SWITCH DETECTED - toggling switch");

        // toggla se switch
        logic.is_on = !logic.is_on;

        const img = component.list[0];
        if (logic.is_on) {
          img.setTexture("stikalo-on");
          component.setData("type", "stikalo-on");
        } else {
          img.setTexture("stikalo-off");
          component.setData("type", "stikalo-off");
        }

        // re-run simulacijo
        this.updateBulbsAndFlows();

        return;
      }

      if (component.getData("isDragging")) return;

      // desni click na gridu je rotate element
      if (pointer.rightButtonDown() && !isInPanel) {
        //console.log("RIGHT CLICK ROTATE DETECTED");
        const currentRotation = component.getData("rotation");
        const newRotation = (currentRotation + 90) % 360;

        component.setData("rotation", newRotation);

        this.tweens.add({
          targets: component,
          angle: newRotation,
          duration: 150,
          ease: "Cubic.easeOut",
          onComplete: () => {
            this.updateLogicNodePositions(component);
            this.updateBulbsAndFlows();
          },
        });

        this.updateLogicNodePositions(component);
      }
    });

    // hover efekt
    component.on("pointerover", () => {
      component.setScale(1.1);
    });

    component.on("pointerout", () => {
      component.setScale(1);
    });
  }

  checkCircuit() {
    const currentChallenge = this.challenges[this.currentChallengeIndex];

    const activeComponents = this.placedComponents.filter((c) => c && c.active);
    const placedTypes = activeComponents.map((c) => c.getData("type"));

    const getCounts = (arr) =>
      arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

    const requiredCounts = getCounts(currentChallenge.requiredComponents);
    const placedCounts = getCounts(placedTypes);

    for (let type in requiredCounts) {
      if ((placedCounts[type] || 0) < requiredCounts[type]) {
        this.checkText
          .setText(`Missing component: ${type} (needs ${requiredCounts[type]})`)
          .setStyle({ color: "#ff0000" });
        return;
      }
    }

    if (!this.sim) {
      this.checkText
        .setText("Circuit is not closed or power is off!")
        .setStyle({ color: "#ff0000" });
      return;
    }

    console.log("SUCCESSFUL TASK", this.currentChallengeIndex);
    this.checkText
      .setText("Task completed.")
      .setStyle({ color: "#17a417" })
      .setStyle({ fontSize: "24px" })
      .setStyle({ fontWeight: "bold" });

    if (this.timerEvent) this.timerEvent.remove();

    this.time.delayedCall(1000, () => this.showTheory(currentChallenge.theory));
  }
  /*
  checkCircuit() {
    const currentChallenge = this.challenges[this.currentChallengeIndex];
    const placedTypes = this.placedComponents.map((comp) =>
      comp.getData("type"),
    );
    //console.log("components", placedTypes);
    this.checkText.setStyle({ color: "#cc0000" });
    // preverjas ce so vse komponente na mizi
    if (
      !currentChallenge.requiredComponents.every((req) =>
        placedTypes.includes(req),
      )
    ) {
      this.checkText.setText("Manjkajo komponente za krog.");
      return;
    }

    // je pravilna simulacija
    if (this.sim == undefined) {
      this.checkText.setText("Zaženi simlacijo");
      return;
    }

    if (this.sim == false) {
      this.checkText.setText(
        "Električni krog ni sklenjen. Preveri kako si ga sestavil",
      );
      return;
    }

    // je zaprt krog

    console.log("SUCCESSFUL TASK ", this.currentChallengeIndex);
    this.checkText.setStyle({ color: "#00aa00" });
    this.checkText.setText("Čestitke! Krog je pravilen.");
    this.addPoints(10);

    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    if (this.timerText) {
      this.timerText.destroy(); // Popolnoma odstrani iz zaslona
      this.timerText = null;
    }

    if (currentChallenge.theory) {
      this.showTheory(currentChallenge.theory);
    } else {
      this.checkText.setStyle({ color: "#00aa00" });
      this.checkText.setText("Čestitke! Krog je pravilen.");
      this.addPoints(10);
      this.time.delayedCall(2000, () => this.nextChallenge());
    }
    // this.placedComponents.forEach(comp => comp.destroy());
    // this.placedComponents = [];
    // this.time.delayedCall(2000, () => this.nextChallenge());
    // const isCorrect = currentChallenge.requiredComponents.every(req => placedTypes.includes(req));
    // if (isCorrect) {
    //   this.checkText.setText('Čestitke! Krog je pravilen.');
    //   this.addPoints(10);
    //   this.time.delayedCall(2000, () => this.nextChallenge());
    // }
    // else {
    //   this.checkText.setText('Krog ni pravilen. Poskusi znova.');
    // }
  }*/

  nextChallenge() {
    this.currentChallengeIndex++;
    localStorage.setItem(
      "currentChallengeIndex",
      this.currentChallengeIndex.toString(),
    );
    this.checkText.setText("");

    // Remove old timer if exists
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    if (this.timerText) {
      this.timerText.destroy();
      this.timerText = null;
    }

    // Reset and start timer for new challenge if there are more
    if (this.currentChallengeIndex < this.challenges.length) {
      this.promptText.setText(
        this.challenges[this.currentChallengeIndex].prompt,
      );
      this.timeRemaining = this.timeLimit;
      this.timerText = this.add
        .text(this.cameras.main.width / 2, 20, "Time: 00:00", {
          fontSize: "24px",
          fill: "#ff0000",
          fontStyle: "bold",
          backgroundColor: "#ffffffaa",
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(2000);
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: this.updateTimer,
        callbackScope: this,
        loop: true,
      });
    } else {
      localStorage.removeItem("currentChallengeIndex");
    }
  }

  addPoints(points) {
    const user = localStorage.getItem("username");
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userData = users.find((u) => u.username === user);
    if (userData) {
      userData.score = (userData.score || 0) + points;
    }
    localStorage.setItem("users", JSON.stringify(users));
  }

  showTheory(theoryText) {
    const { width, height } = this.cameras.main;

    this.theoryBack = this.add
      .rectangle(width / 2, height / 2, width - 100, 150, 0x000000, 0.8)
      .setOrigin(0.5)
      .setDepth(10);

    this.theoryText = this.add
      .text(width / 2, height / 2, theoryText, {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: width - 150 },
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.continueButton = this.add
      .text(width / 2, height / 2 + 70, "Continue", {
        fontSize: "18px",
        color: "#0066ff",
        backgroundColor: "#ffffff",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () =>
        this.continueButton.setStyle({ color: "#0044cc" }),
      )
      .on("pointerout", () =>
        this.continueButton.setStyle({ color: "#0066ff" }),
      )
      .on("pointerdown", () => {
        this.cleanupFlows();
        this.hideTheory();
        this.placedComponents.forEach((comp) => {
          const logic = comp.getData("logicComponent");
          if (logic && typeof this.graph.removeComponent === "function") {
            this.graph.removeComponent(logic);
          }
          comp.destroy();
        });
        this.placedComponents = [];
        this.nextChallenge();
      });
  }

  hideTheory() {
    if (this.theoryBack) {
      this.theoryBack.destroy();
      this.theoryBack = null;
    }
    if (this.theoryText) {
      this.theoryText.destroy();
      this.theoryText = null;
    }
    if (this.continueButton) {
      this.continueButton.destroy();
      this.continueButton = null;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#f0f0f0",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [LabScene, WorkspaceScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

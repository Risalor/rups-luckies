import Phaser from 'phaser';

export default class LabScene extends Phaser.Scene {
  constructor() {
    super('LabScene');
  }

  preload() {
    this.load.image('avatar1', 'src/avatars/avatar1.png');
    this.load.image('avatar2', 'src/avatars/avatar2.png');
    this.load.image('avatar3', 'src/avatars/avatar3.png');
    this.load.image('avatar4', 'src/avatars/avatar4.png');
    this.load.image('avatar5', 'src/avatars/avatar5.png');
    this.load.image('avatar6', 'src/avatars/avatar6.png');
    this.load.image('avatar7', 'src/avatars/avatar7.png');
    this.load.image('avatar8', 'src/avatars/avatar8.png');
    this.load.image('avatar9', 'src/avatars/avatar9.png');
    this.load.image('avatar10', 'src/avatars/avatar10.png');
    this.load.image('avatar11', 'src/avatars/avatar11.png');
    this.load.image('LogicGatesIcon', 'src/components/GateIco.png');
    this.load.image('ElecTecIcon', 'src/components/elec.png');
  }

  create() {
    const { width, height } = this.cameras.main;
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const username = localStorage.getItem('username') || 'Gost';
    
    let profilePic = 'avatar1';
    if (userData.displayImage) {
      profilePic = userData.displayImage;
    } else if (localStorage.getItem('profilePic')) {
      profilePic = localStorage.getItem('profilePic');
    }
    
    this.add.rectangle(0, 0, width, height, 0xf0f0f0).setOrigin(0);
    
    
    this.add.rectangle(0, 0, width, height - 150, 0xe8e8e8).setOrigin(0);
    
    this.add.rectangle(0, height - 150, width, 150, 0xd4c4a8).setOrigin(0);
    
    const tableX = width / 2;
    const tableY = height / 2 + 50;
    const tableWidth = 500;
    const tableHeight = 250;
    
    const tableTop1 = this.add.rectangle(tableX - (width / 4), tableY, tableWidth, 30, 0x8b4513).setOrigin(0.5);
    const tableTopLogicGates = this.add.rectangle(tableX + (width / 4), tableY, tableWidth, 30, 0x8b4513).setOrigin(0.5);
    
    const tableSurface1 = this.add.rectangle(tableX - (width / 4), tableY + 15, tableWidth - 30, tableHeight - 30, 0xa0826d).setOrigin(0.5, 0);
    const tableSurfaceLogicGates = this.add.rectangle(tableX + (width / 4), tableY + 15, tableWidth - 30, tableHeight - 30, 0xa0826d).setOrigin(0.5, 0);
    
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x8b7355, 0.3);

    const gridGraphicsLogicGates = this.add.graphics();
    gridGraphicsLogicGates.lineStyle(1, 0x8b7355, 0.3);

    const gridSize = 30;
    const gridStartX = tableX - (width / 4) - (tableWidth - 30) / 2;
    const gridStartY = tableY + 15;
    const gridEndX = tableX - (width / 4) + (tableWidth - 30) / 2;
    const gridEndY = tableY + 15 + (tableHeight - 30);

    const gridStartXLogicGates = tableX + (width / 4) - (tableWidth - 30) / 2;
    const gridStartYLogicGates = tableY + 15;
    const gridEndXLogicGates = tableX + (width / 4) + (tableWidth - 30) / 2;
    const gridEndYLogicGates = tableY + 15 + (tableHeight - 30);
    
    for (let x = gridStartX; x <= gridEndX; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, gridStartY);
      gridGraphics.lineTo(x, gridEndY);
      gridGraphics.strokePath();
    }
    for (let y = gridStartY; y <= gridEndY; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(gridStartX, y);
      gridGraphics.lineTo(gridEndX, y);
      gridGraphics.strokePath();
    }

    for (let x = gridStartXLogicGates; x <= gridEndXLogicGates; x += gridSize) {
      gridGraphicsLogicGates.beginPath();
      gridGraphicsLogicGates.moveTo(x, gridStartYLogicGates);
      gridGraphicsLogicGates.lineTo(x, gridEndYLogicGates);
      gridGraphicsLogicGates.strokePath();
    }
    for (let y = gridStartYLogicGates; y <= gridEndYLogicGates; y += gridSize) {
      gridGraphicsLogicGates.beginPath();
      gridGraphicsLogicGates.moveTo(gridStartXLogicGates, y);
      gridGraphicsLogicGates.lineTo(gridEndXLogicGates, y);
      gridGraphicsLogicGates.strokePath();
    }
    
    const legWidth = 20;
    const legHeight = 150;
    this.add.rectangle(tableX - (width / 4) - tableWidth/2 + 40, tableY + tableHeight/2 + 20, legWidth, legHeight, 0x654321);
    this.add.rectangle(tableX - (width / 4) + tableWidth/2 - 40, tableY + tableHeight/2 + 20, legWidth, legHeight, 0x654321);

    this.add.rectangle(tableX + (width / 4) - tableWidth/2 + 40, tableY + tableHeight/2 + 20, legWidth, legHeight, 0x654321);
    this.add.rectangle(tableX + (width / 4) + tableWidth/2 - 40, tableY + tableHeight/2 + 20, legWidth, legHeight, 0x654321);
    
    const interactiveZone1 = this.add.zone(tableX - (width / 4), tableY + tableHeight/2, tableWidth, tableHeight)
      .setInteractive({ useHandCursor: true });

    const interactiveZoneLogicGates = this.add.zone(tableX + (width / 4), tableY + tableHeight/2, tableWidth, tableHeight)
      .setInteractive({ useHandCursor: true });
    
    const instruction = this.add.text(tableX - (width / 4), tableY - 80, 'Klikni na mizo in začni graditi svoj električni krok!', {
      fontSize: '24px',
      color: '#333',
      fontStyle: 'bold',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    const instructionLogicGates = this.add.text(tableX + (width / 4), tableY - 80, 'Klikni na mizo in začni spoznavati logične funkcije!', {
      fontSize: '24px',
      color: '#333',
      fontStyle: 'bold',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: instruction,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.tweens.add({
      targets: instructionLogicGates,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.add.image(tableX + (width / 4), tableY + tableHeight/2, 'LogicGatesIcon').setDisplaySize(width/12, height/10);
    this.add.image(tableX - (width / 4), tableY + tableHeight/2, 'ElecTecIcon').setDisplaySize(width/15, height/7);
    
    interactiveZone1.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('WorkspaceScene');
      });
    });
    
    interactiveZone1.on('pointerover', () => {
      tableSurface1.setFillStyle(0xb09070);
    });
    
    interactiveZone1.on('pointerout', () => {
      tableSurface1.setFillStyle(0xa0826d);
    });

    interactiveZoneLogicGates.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('workspaceSceneLogicGates');
        //console.log("Start the logic gates workspace");
      });
    });
    
    interactiveZoneLogicGates.on('pointerover', () => {
      tableSurfaceLogicGates.setFillStyle(0xb09070);
    });
    
    interactiveZoneLogicGates.on('pointerout', () => {
      tableSurfaceLogicGates.setFillStyle(0xa0826d);
    });

    const welcomeText = username !== 'Gost' 
      ? `Dobrodošel nazaj, ${username}!`
      : 'Dobrodošel v laboratoriju kot gost!';

    const avatarX = 230;
    const avatarY = 55;
    const avatarRadius = 30;
    const borderThickness = 4;

    const borderCircle = this.add.circle(avatarX, avatarY, avatarRadius + borderThickness, 0xcccccc);

    const innerCircle = this.add.circle(avatarX, avatarY, avatarRadius, 0xffffff);

    const avatarKey = username !== 'Gost' && this.textures.exists(profilePic) ? profilePic : 'avatar1';
    const avatarImage = this.add.image(avatarX, avatarY, avatarKey)
        .setDisplaySize(avatarRadius * 2, avatarRadius * 2);

    const mask = innerCircle.createGeometryMask();
    avatarImage.setMask(mask);

    this.add.text(avatarX + 60, avatarY - 10, welcomeText, {
        fontSize: '22px',
        color: '#222',
        fontStyle: 'bold'
    });

    if (username !== 'Gost' && userData.playedGames && userData.playedGames.length > 0) {
      const totalGames = userData.playedGames.length;
      const totalScore = userData.playedGames.reduce((sum, game) => sum + game.score, 0);
      const averageScore = totalScore / totalGames;
      
      this.add.text(avatarX + 60, avatarY + 25, `Igre: ${totalGames} | Povpr. rezultat: ${averageScore.toFixed(1)}`, {
        fontSize: '16px',
        color: '#555'
      });
    }

    if (username !== 'Gost') {
      const logoutButton = this.add.text(40, 30, '↩ Odjavi se', {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#0066ff',
          padding: { x: 20, y: 10 }
      })
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => logoutButton.setStyle({ color: '#0044cc' }))
          .on('pointerout', () => logoutButton.setStyle({ color: '#0066ff' }))
          .on('pointerdown', () => {
              localStorage.removeItem('username');
              localStorage.removeItem('userData');
              localStorage.removeItem('profilePic');
              this.scene.start('LabScene');
          });
    } else {
      const loginButton = this.add.text(40, 30, '↩ Prijavi se', {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#00aa00',
          padding: { x: 20, y: 10 }
      })
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => loginButton.setStyle({ color: '#008800' }))
          .on('pointerout', () => loginButton.setStyle({ color: '#00aa00' }))
          .on('pointerdown', () => {
              this.scene.start('LoginScene');
          });
    }

    const buttonWidth = 180;
    const buttonHeight = 45;
    const cornerRadius = 10;
    const rightMargin = 60;
    const topMargin = 40;

    const scoreButtonBg = this.add.graphics();
    scoreButtonBg.fillStyle(0x3399ff, 1);
    scoreButtonBg.fillRoundedRect(width - buttonWidth - rightMargin, topMargin, buttonWidth, buttonHeight, cornerRadius);

    const scoreButton = this.add.text(width - buttonWidth / 2 - rightMargin, topMargin + buttonHeight / 2, 'Lestvica', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff'
    })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            scoreButtonBg.clear();
            scoreButtonBg.fillStyle(0x0f5cad, 1);
            scoreButtonBg.fillRoundedRect(width - buttonWidth - rightMargin, topMargin, buttonWidth, buttonHeight, cornerRadius);
        })
        .on('pointerout', () => {
            scoreButtonBg.clear();
            scoreButtonBg.fillStyle(0x3399ff, 1);
            scoreButtonBg.fillRoundedRect(width - buttonWidth - rightMargin, topMargin, buttonWidth, buttonHeight, cornerRadius);
        })
        .on('pointerdown', () => {
            this.scene.start('ScoreboardScene', {cameFromMenu: true});
        });

    // Profile settings button (only if logged in)
    if (username !== 'Gost') {
      const profileButtonBg = this.add.graphics();
      profileButtonBg.fillStyle(0x9966cc, 1);
      profileButtonBg.fillRoundedRect(width - buttonWidth - rightMargin, topMargin + buttonHeight + 20, buttonWidth, buttonHeight, cornerRadius);

      const profileButton = this.add.text(width - buttonWidth / 2 - rightMargin, topMargin + buttonHeight + 20 + buttonHeight / 2, 'Moj Profil', {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#ffffff'
      })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
              profileButtonBg.clear();
              profileButtonBg.fillStyle(0x7a4fa3, 1);
              profileButtonBg.fillRoundedRect(width - buttonWidth - rightMargin, topMargin + buttonHeight + 20, buttonWidth, buttonHeight, cornerRadius);
          })
          .on('pointerout', () => {
              profileButtonBg.clear();
              profileButtonBg.fillStyle(0x9966cc, 1);
              profileButtonBg.fillRoundedRect(width - buttonWidth - rightMargin, topMargin + buttonHeight + 20, buttonWidth, buttonHeight, cornerRadius);
          })
          .on('pointerdown', () => {
              this.scene.start('ProfileScene');
          });
    }
  }
}
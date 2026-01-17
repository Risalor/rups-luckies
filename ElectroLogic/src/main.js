import './style.css'
import Phaser from 'phaser';

import UIScene from './scenes/UIScene';
import PreloadScene from './scenes/preloadScene';
import MenuScene from './scenes/menuScene';
import LabScene from './scenes/labScene';
import TestScene from './scenes/testScene';
import LoginScene from './scenes/loginScene';
import ScoreboardScene from './scenes/scoreboardScene';
import WorkspaceScene from './scenes/workspaceScene';
import WorkspaceSceneLogicGates from './scenes/workspaceSceneLogicGates';
import ProfileScene from './scenes/ProfileScene'

const urlParams = new URLSearchParams(window.location.search);
const sceneParam = urlParams.get('scene');

let startScene;
switch(sceneParam) {
  case 'logic':
    startScene = WorkspaceSceneLogicGates;
    break;
  case 'workspace':
    startScene = WorkspaceScene;
    break;
  default:
    startScene = WorkspaceScene;
}

const config = {
  type: Phaser.AUTO,            
  width: window.innerWidth,                    
  height: window.innerHeight,                   
  backgroundColor: '#f4f6fa',    
  parent: 'game-container',      
  scene: [
    startScene,
    
    sceneParam === 'logic' ? WorkspaceScene : WorkspaceSceneLogicGates,
    MenuScene,
    LabScene,
    PreloadScene,
    UIScene,
    TestScene,
    LoginScene,
    ScoreboardScene,
    ProfileScene
  ].filter(Boolean),
  physics: {
    default: 'arcade',           
    arcade: {
      gravity: { y: 0 },         
      debug: false               
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,      
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
export default game;
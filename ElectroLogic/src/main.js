import './style.css'
import Phaser from 'phaser';

// uvoz scen
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

// Get scene from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const sceneParam = urlParams.get('scene');

// Determine which scene to start with
let startScene;
switch(sceneParam) {
  case 'logic':
    startScene = WorkspaceSceneLogicGates;
    break;
  case 'workspace':
    startScene = WorkspaceScene;
    break;
  default:
    // Default to WorkspaceScene if no parameter
    startScene = WorkspaceScene;
    // Or use logic gates as default:
    // startScene = WorkspaceSceneLogicGates;
}

const config = {
  type: Phaser.AUTO,            
  width: window.innerWidth,                    
  height: window.innerHeight,                   
  backgroundColor: '#f4f6fa',    
  parent: 'game-container',      
  scene: [
    startScene,  // Start with the determined scene
    
    // Add all other scenes
    sceneParam === 'logic' ? WorkspaceScene : WorkspaceSceneLogicGates, // Add the other one
    MenuScene,
    LabScene,
    PreloadScene,
    UIScene,
    TestScene,
    LoginScene,
    ScoreboardScene,
    ProfileScene
  ].filter(Boolean), // Remove any null/undefined scenes
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

// inicializacija igre
const game = new Phaser.Game(config);
export default game;
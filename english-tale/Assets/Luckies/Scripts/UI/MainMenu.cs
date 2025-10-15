using UnityEngine;
using UnityEngine.SceneManagement;

public class MainMenu : MonoBehaviour
{
    [SerializeField] private string gameSceneName = "MainScene";

    [Header("UI Panels")]
    [SerializeField] private GameObject mainMenuPanel; 
    [SerializeField] private GameObject optionsPanel;

    [Header("Background Images")]
    [SerializeField] private GameObject mainMenuBackground; 
    [SerializeField] private GameObject optionsBackground;

    public void PlayGame()
    {
        SceneManager.LoadScene(gameSceneName);
    }

    public void QuitGame()
    {
        Debug.Log("quit game");
        Application.Quit();
    }

    public void ShowOptions()
    {
        mainMenuPanel.SetActive(false);
        mainMenuBackground.SetActive(false); 
        optionsPanel.SetActive(true);
        optionsBackground.SetActive(true);
    }

    public void HideOptions()
    {
        optionsPanel.SetActive(false);
        optionsBackground.SetActive(false); 
        mainMenuPanel.SetActive(true);
        mainMenuBackground.SetActive(true);
    }
}

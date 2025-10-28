using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    private void Awake()
    {
        this.SetupSingleton(ref Instance);
    }

    private void Start()
    {
        MainMenu.Instance.Show();
        Dictionary.Instance.Hide();
        GameWorld.Instance.gameObject.SetActive(false);
    }

    public void StartGame()
    {
        MainMenu.Instance.Hide();
        GameWorld.Instance.StartGame();
    }

    public void ReturnToMainMenu()
    {
        Dictionary.Instance.Hide();
        MainMenu.Instance.Show();
    }
}

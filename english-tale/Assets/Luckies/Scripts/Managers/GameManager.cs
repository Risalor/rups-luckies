using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    private void Awake()
    {
        this.SetupSingleton(ref Instance, true);

        MainMenu.Instance.Hide();
        Dictionary.Instance.Hide();
        GameWorld.Instance.gameObject.SetActive(false);
    }

    public void StartGame()
    {
        MainMenu.Instance.Show();
        GameWorld.Instance.StartGame();
    }

    public void ReturnToMainMenu()
    {
        Dictionary.Instance.Hide();
        MainMenu.Instance.Show();
    }
}

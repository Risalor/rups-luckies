using System.Collections.Generic;
using UnityEngine;

public class GameWorld : MonoBehaviour
{
    public static GameWorld Instance = null;

    public Dictionary<GameObject, Entity> entityMap = new();

    public void Awake()
    {
        this.SetupSingleton(ref Instance);

        gameObject.SetActive(false);
    }

    public void StartGame()
    {
        this.SmartLog("Game started");
        gameObject.SetActive(true);
    }

    public void EndGame()
    {
        this.SmartLog("Game ended");
        gameObject.SetActive(false);

        GameManager.Instance.ReturnToMainMenu();
    }
}

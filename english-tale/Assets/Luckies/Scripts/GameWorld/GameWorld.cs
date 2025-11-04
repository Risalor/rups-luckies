using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Tilemaps;

public class GameWorld : MonoBehaviour
{
    public static GameWorld Instance = null;

    public Entity[] enemyPrefabs;
    public Tilemap spawnTilemap;

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

        SpawnEnemiesOnTiles();
    }

    void SpawnEnemiesOnTiles()
    {
        BoundsInt bounds = spawnTilemap.cellBounds;

        foreach (var pos in bounds.allPositionsWithin)
        {
            TileBase tile = spawnTilemap.GetTile(pos);
            if (tile == null) continue;

            Entity enemyPrefab = enemyPrefabs[Random.Range(0, enemyPrefabs.Length)];

            Vector3 worldPos = spawnTilemap.CellToWorld(pos) + spawnTilemap.tileAnchor;
            Entity newEnemy = Instantiate(enemyPrefab, worldPos, Quaternion.identity);
            entityMap.Add(newEnemy.gameObject, newEnemy);
        }
    }

    public void EndGame()
    {
        this.SmartLog("Game ended");
        gameObject.SetActive(false);

        GameManager.Instance.ReturnToMainMenu();
    }
}

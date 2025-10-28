using UnityEngine;

[RequireComponent(typeof(BoxCollider2D))]
public class Entity : MonoBehaviour
{
    public int maxHealth = 10;
    public int currentHealth = 0;
    public int damage = 1;

    private Entity _opponent = null;
    private BoxCollider2D _collider = null;
    protected BoxCollider2D Collider => _collider ??= GetComponent<BoxCollider2D>();

    public virtual void Setup(Vector3 spawnPosition)
    {
        currentHealth = maxHealth;
        transform.position = spawnPosition;

        gameObject.SetActive(true);
    }
}

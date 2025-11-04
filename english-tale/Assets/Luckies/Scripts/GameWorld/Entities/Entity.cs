using UnityEngine;

[RequireComponent(typeof(BoxCollider2D))]
[RequireComponent(typeof(Animator))]
public class Entity : MonoBehaviour
{
    public SpriteRenderer entitySprite;

    public int maxHealth = 10;
    public int currentHealth = 0;
    public int damage = 1;

    private bool _originalSpriteFlip;
    protected bool _isMoving = false;

    private Entity _opponent = null;
    private BoxCollider2D _collider = null;
    protected BoxCollider2D Collider => _collider ??= GetComponent<BoxCollider2D>();

    private Animator _animator;
    protected Animator MainAnimator => _animator ??= GetComponent<Animator>();

    private void Awake()
    {
        _originalSpriteFlip = entitySprite.flipX;
    }

    protected void LookLeft()
    {
        entitySprite.flipX = !_originalSpriteFlip;
    }

    protected void LookRight()
    {
        entitySprite.flipX = _originalSpriteFlip;
    }

    public virtual void Setup(Vector3 spawnPosition)
    {
        currentHealth = maxHealth;
        transform.position = spawnPosition;

        gameObject.SetActive(true);
    }

    protected virtual void Update()
    {
        MainAnimator.SetBool("isRunning", _isMoving);
    }
}

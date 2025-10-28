using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class Player : Entity
{
    public float movementSpeed = 5f;

    private int _wallCounter = 0;
    private Vector3 _targetPosition;
    private bool _isMoving = false;

    public bool CanMove => _wallCounter == 0;

    public override void Setup(Vector3 spawnPosition)
    {
        _targetPosition = spawnPosition;
        base.Setup(spawnPosition);
    }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        this.SmartLog($"Player collided with {collision.gameObject.name}");

        if (collision.CompareTag("Enemy"))
            OnEnemyCollide(collision.gameObject);

        if (collision.CompareTag("Wall"))
            _wallCounter++;
    }

    private void OnEnemyCollide(GameObject enemyObject)
    {
        if (!GameWorld.Instance.entityMap.TryGetValue(enemyObject, out Entity enemyEntity))
            return;

        enemyEntity.SmartLog("Collided with Player");
    }

    public void Move(Vector3 direction)
    {
        if (_isMoving || _wallCounter > 0)
            return;

        if (direction.x != 0)
            direction = Vector3.right * direction.x;
        else if (direction.y != 0)
            direction = Vector3.up * direction.y;
        else
            return;

        _targetPosition = transform.position + direction.normalized;
        _isMoving = true;
    }

    private void Update()
    {
        if (!CanMove)
            _isMoving = false;

        if (_isMoving)
        {
            transform.position = Vector3.MoveTowards(transform.position, _targetPosition, movementSpeed * Time.deltaTime);

            if (transform.position == _targetPosition)
                _isMoving = false;
        }
    }
}

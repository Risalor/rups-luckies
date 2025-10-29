using System.Collections.Generic;
using UnityEngine;

public class PlayerMovementPath
{
    public int logSize;
    private List<Vector2> _destinationLog = new();

    public PlayerMovementPath()
    {
        logSize = 1;
    }

    public PlayerMovementPath(int size)
    {
        logSize = size;
    }

    public void AddDestination(Vector2 destination)
    {
        if (_destinationLog[^1] == destination)
            return;

        _destinationLog.Add(destination);

        if (_destinationLog.Count > logSize)
            _destinationLog.RemoveAt(0);
    }

    public Vector2 GetCurrentDestination()
    {
        return _destinationLog[^1];
    }

    public void RemoveCurrentDestination()
    {
        _destinationLog.RemoveAt(_destinationLog.Count - 1);
    }
}

[RequireComponent(typeof(Rigidbody2D))]
public class Player : Entity
{
    public bool moveGrid = true;
    public float movementSpeed = 5f;

    private int _wallCounter = 0;
    private Vector3 _bannedTargetPosition = INFINITY_VECTOR;
    private Vector3 _targetPosition;
    private Vector3 _oldPosition;
    private bool _isMoving = false;

    private Vector3 _movementDirection;
    private Vector3 _bannedMoveDirection = Vector3.zero;

    private static Vector3 INFINITY_VECTOR = new(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity);

    public bool HittingWall => _wallCounter > 0;

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

    private void OnTriggerExit2D(Collider2D collision)
    {
        this.SmartLog($"Player exited collision with {collision.gameObject.name}");

        if (collision.CompareTag("Wall"))
            _wallCounter--;
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        this.SmartLog($"Player collided with {collision.gameObject.name}");

        if (collision.gameObject.CompareTag("Wall"))
        {
            _bannedTargetPosition = _targetPosition;
            _bannedMoveDirection = _movementDirection;
            _wallCounter++;
        }
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        this.SmartLog($"Player exited collision with {collision.gameObject.name}");

        if (collision.gameObject.CompareTag("Wall"))
        {
            _bannedMoveDirection = Vector3.zero;
            _wallCounter--;
        }
    }

    private void OnEnemyCollide(GameObject enemyObject)
    {
        if (!GameWorld.Instance.entityMap.TryGetValue(enemyObject, out Entity enemyEntity))
            return;

        enemyEntity.SmartLog("Collided with Player");
    }

    public void MoveFree(Vector3 direction)
    {
        if (_bannedMoveDirection == direction)
            _movementDirection = Vector3.zero;
        else
            _movementDirection = direction;
    }

    public void MoveGrid(Vector3 direction)
    {
        if (_isMoving || _wallCounter > 0)
            return;

        if (direction.x != 0)
            direction = Vector3.right * direction.x;
        else if (direction.y != 0)
            direction = Vector3.up * direction.y;
        else
            return;

        if (!HittingWall)
            _oldPosition = transform.position;
        _targetPosition = transform.position + direction.normalized;

        if (_targetPosition == _bannedTargetPosition)
            return;

        _bannedTargetPosition = INFINITY_VECTOR;
        _isMoving = true;
    }

    private void Update()
    {
        if (moveGrid)
        {
            if (HittingWall)
                _targetPosition = _oldPosition;

            if (_isMoving)
            {
                transform.position = Vector3.MoveTowards(transform.position, _targetPosition, movementSpeed * Time.deltaTime);

                if (transform.position == _targetPosition)
                    _isMoving = false;
            }
        } else
        {
            transform.position += _movementDirection * movementSpeed * Time.deltaTime;
        }
    }
}

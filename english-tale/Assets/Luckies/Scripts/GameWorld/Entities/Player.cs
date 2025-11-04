using UnityEngine;
using UnityEngine.Rendering;

[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(SortingGroup))]
public class Player : Entity
{
    public float movementSpeed = 5f;

    private Vector3 _bannedTargetPosition = INFINITY_VECTOR;
    private Vector3 _targetPosition;
    private Vector3 _oldPosition;

    private static Vector3 INFINITY_VECTOR = new(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity);

    public bool hittingWall = false;
    public bool inTunnel = false;
    public bool ignoreTunnel = false;

    private SortingGroup _group = null;
    private SortingGroup Group => _group ??= GetComponent<SortingGroup>();

    public override void Setup(Vector3 spawnPosition)
    {
        _targetPosition = spawnPosition;
        base.Setup(spawnPosition);
    }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Enemy"))
            OnEnemyCollide(collision.gameObject);

        if (collision.gameObject.CompareTag("RaisedFloor") && !inTunnel)
            ignoreTunnel = true;

        if (collision.gameObject.CompareTag("Tunnel") && !ignoreTunnel)
            inTunnel = true;

        if (collision.gameObject.CompareTag("Wall") && !inTunnel)
            OnHitWall();

        if (collision.gameObject.CompareTag("HiddenWall") && inTunnel)
            OnHitWall();
    }

    private void OnEnemyCollide(GameObject enemyObject)
    {
        if (!GameWorld.Instance.entityMap.TryGetValue(enemyObject, out Entity enemyEntity))
            return;

        enemyEntity.SmartLog("Collided with Player");
    }

    private void OnHitWall()
    {
        _bannedTargetPosition = _targetPosition;
        hittingWall = true;
    }

    private void OnTriggerExit2D(Collider2D collision)
    {
        if (collision.gameObject.CompareTag("RaisedFloor") && !inTunnel)
            ignoreTunnel = false;

        if (collision.gameObject.CompareTag("Tunnel") && !ignoreTunnel)
            inTunnel = false;

        if (collision.gameObject.CompareTag("Wall") && !inTunnel)
            OnExitWall();

        if (collision.gameObject.CompareTag("HiddenWall") && inTunnel)
            OnExitWall();
    }

    private void OnExitWall()
    {
        hittingWall = false;
    }

    public void MoveGrid(Vector3 direction)
    {
        if (_isMoving || hittingWall)
            return;

        if (direction.x != 0)
            direction = Vector3.right * direction.x;
        else if (direction.y != 0)
            direction = Vector3.up * direction.y;
        else
            return;

        if (!hittingWall)
            _oldPosition = transform.position;
        _targetPosition = transform.position + direction.normalized;

        if (_targetPosition == _bannedTargetPosition)
            return;

        if (direction.x > 0)
            LookRight();
        else if (direction.x < 0)
            LookLeft();

        _bannedTargetPosition = INFINITY_VECTOR;
        _isMoving = true;
    }

    protected override void Update()
    {
        base.Update();

        Group.sortingLayerName = inTunnel ? "HiddenCharacter" : "Character";

        if (hittingWall)
            _targetPosition = _oldPosition;

        if (_isMoving)
        {
            transform.position = Vector3.MoveTowards(transform.position, _targetPosition, movementSpeed * Time.deltaTime);

            if (transform.position == _targetPosition)
                _isMoving = false;
        }
    }
}

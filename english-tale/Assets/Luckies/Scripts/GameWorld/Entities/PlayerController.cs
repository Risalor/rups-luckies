using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Player))]
public class PlayerController : MonoBehaviour
{
    public InputAction controls;

    private Player _player;
    private Player Player => _player ??= GetComponent<Player>();

    private void OnEnable()
    {
        controls.Enable();
    }

    private void OnDisable()
    {
        controls.Disable();
    }

    private void Update()
    {
        Player.MoveFree(controls.ReadValue<Vector2>());
        Player.MoveGrid(controls.ReadValue<Vector2>());
    }
}

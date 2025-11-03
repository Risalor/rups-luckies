using UnityEngine;

public class CameraFollowController : MonoBehaviour
{
    public bool followEnabled = true;

    private Camera _mainCamera;
    private Camera MainCamera => _mainCamera ??= Camera.main;
    private float _originalCameraZ = 0f;

    private void Start()
    {
        _originalCameraZ = MainCamera.transform.position.z;
    }

    private void Update()
    {
        if (!followEnabled || MainCamera == null)
            return;

        MainCamera.transform.position = new Vector3(
            transform.position.x,
            transform.position.y,
            _originalCameraZ
        );
    }
}

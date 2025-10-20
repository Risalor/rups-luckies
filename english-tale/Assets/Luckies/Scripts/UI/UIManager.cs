using UnityEngine;

public class UIManager : MonoBehaviour
{
    public GameObject dictionary;
    private bool dictToggle = true;

    public void OnDictionaryToggle()
    {
        dictionary.SetActive(dictToggle);
        dictToggle = !dictToggle;
    }

}

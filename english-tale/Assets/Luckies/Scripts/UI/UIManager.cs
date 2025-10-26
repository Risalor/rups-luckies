using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public GameObject Dictionary;
    private bool DictToggle = true;
    private void Awake()
    {

    }

    public void OnDictionaryToggle()
    {
        Dictionary.SetActive(DictToggle);
        DictToggle = !DictToggle;
    }

}

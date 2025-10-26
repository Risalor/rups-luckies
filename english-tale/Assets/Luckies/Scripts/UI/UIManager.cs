using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public GameObject Dictionary;
    private Animator anim = null;
    private bool DictToggle = true;
    private void Awake()
    {
        anim = Dictionary.GetComponent<Animator>();

        if (anim == null)
        {
            Debug.LogError("No Animator component found on Dictionary GameObject!");
        }
    }

    public void OnDictionaryToggle()
    {
        if(anim == null)
        {
            anim = Dictionary.GetComponent<Animator>();
        }

        if(DictToggle)
        {
            anim.SetBool("SlideIn", true);
            anim.SetBool("SlideOut", false);
        } else
        {
            anim.SetBool("SlideIn", false);
            anim.SetBool("SlideOut", true);
        }

        DictToggle = !DictToggle;
    }

}

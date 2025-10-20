using System.Collections.Generic;
using NUnit.Framework.Internal.Execution;
using UnityEngine;
using TMPro;

public class UIManager : MonoBehaviour
{
    public GameObject Dictionary;
    public TMP_Text DictionaryText;
    private bool DictToggle = true;

    private List<WordManager.WordItem> WordsDb;
    private string DictionaryDisplay = "";

    private void Awake()
    {
        WordsDb = WordManager.Instance.getAllWords();

        for (int i = 0; i < WordsDb.Count; i++)
        {
            DictionaryDisplay += WordsDb[i].eng_word + " - " + WordsDb[i].slo_word + "\n";
        }
        
        DictionaryText.text = DictionaryDisplay;
    }

    public void OnDictionaryToggle()
    {
        Dictionary.SetActive(DictToggle);
        DictToggle = !DictToggle;
    }

}

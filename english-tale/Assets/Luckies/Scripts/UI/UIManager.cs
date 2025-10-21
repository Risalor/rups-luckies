using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public GameObject Dictionary;
    public TMP_Text DictionaryText;
    private bool DictToggle = true;
    public ScrollRect DictionaryScrollRect;

    private List<WordItem> WordsDb;
    private string DictionaryDisplay = "";

    private void Awake()
    {
        WordsDb = WordManager.Instance.getAllWords();

        for (int i = 0; i < WordsDb.Count; i++)
        {
            DictionaryDisplay += WordsDb[i].eng_word + " - " + WordsDb[i].slo_word + "\n";
        }

        DictionaryText.text = DictionaryDisplay;
        DictionaryScrollRect.verticalNormalizedPosition = 1;
    }

    public void OnDictionaryToggle()
    {
        Dictionary.SetActive(DictToggle);
        DictToggle = !DictToggle;
    }

}

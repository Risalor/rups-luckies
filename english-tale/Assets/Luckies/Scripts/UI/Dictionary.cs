using UnityEngine;

public class Dictionary : MonoBehaviour
{
    public DictionaryEntry entryPrefab;
    public Transform content;

    private void Start()
    {
        foreach(var child in content.GetComponentsInChildren<DictionaryEntry>())
            Destroy(child.gameObject);

        foreach (var word in WordManager.Instance.wordDB)
            Instantiate(entryPrefab, content).Setup(word);
    }
}

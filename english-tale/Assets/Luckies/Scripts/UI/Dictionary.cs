using UnityEngine;

public class Dictionary : UIObject
{
    public static Dictionary Instance;

    public DictionaryEntry entryPrefab;
    public Transform content;

    public void Awake()
    {
        this.SetupSingleton(ref Instance, true);

        gameObject.SetActive(false);
    }

    private void Start()
    {
        foreach(var child in content.GetComponentsInChildren<DictionaryEntry>())
            Destroy(child.gameObject);

        foreach (var word in WordManager.Instance.wordDB)
            Instantiate(entryPrefab, content).Setup(word);
    }
}
